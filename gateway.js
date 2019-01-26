// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var WebSocketServer = require('websocket').server;
var http            = require('http');

function Connection (uuid, sock) {
	self = this;
	
	this.Socket 		= sock;
	this.UUID 			= uuid;
	this.Subscribers 	= [];

	this.AddSubscriber = function (uuid) {
		this.Subscribers.push(uuid);
	}

	this.RemoveSubscriber = function (uuid) {
		for (var index in this.Subscribers) {
			if (this.Subscribers[index] == uuid) {
				this.Subscribers.splice(index, 1);
			}
		}
	}

	this.CleanSubscribers = function () {
		this.Subscribers = [];
	}

	return this;
}

function ApplicationSession (key, sock) {
	self = this;
	
	this.Socket 		= sock;
	this.Key 			= key;
	
	return this;
}

function MkSGateway (gatewayInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 			= "[Gateway]#";
	this.WebsocketPort 			= gatewayInfo.WsPort;
	this.RestAPIPort 			= gatewayInfo.RestAPIPort;
	this.WSNodeClients 			= [];
	this.WSApplicationClients 	= [];
	this.ServerNode				= null;
	this.WSNode					= null;
	this.ServerApplication 		= null;
	this.WSApplication			= null;
	this.RestApi 				= express();
	this.Database 				= null;
	this.NodeList				= {}; // Key is node uuid
	this.ApplicationList		= {}; // Key is user key
	
	this.RestApi.use(bodyParser.json());
	this.RestApi.use(bodyParser.urlencoded({ extended: true }));
	
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
	
	return this;
}

MkSGateway.prototype.SetDatabaseInstance = function (db) {
	this.Database = db;
}

MkSGateway.prototype.InitRouter = function (server) {
	var self = this;
	
	server.get('/api/get/app/connections', function(req, res) {
		console.log(self.ModuleName, "/api/get/app/connections");
		res.json({error:"none"});
	});
	
	server.get('/api/get/node/connections', function(req, res) {
		console.log(self.ModuleName, "/api/get/node/connections");
		var connections = [];
		for (var key in self.NodeList) {
			var item = self.NodeList[key];
			connections.push({uuid:item.UUID});
		}
		res.json({error:"none", data:connections});
	});
}

MkSGateway.prototype.FindSessionBySocket = function (socket) {
	for (var key in this.ApplicationList) {
		var session = this.ApplicationList[key];
		console.log(socket, session.Socket);
		if (socket == session.Socket)
			return session;
	}
	
	return null;
}

MkSGateway.prototype.GetConnectionsApplicationList = function () {
	console.log(this.ModuleName, "GetConnectionsApplicationList");
}
	
MkSGateway.prototype.GetConnectionsNodeList = function () {
	console.log(this.ModuleName, "GetConnectionsNodeList");
}

MkSGateway.prototype.Start = function () {
	var self = this;
	
	// Create listener server
	this.ServerNode = http.createServer(function(request, response) {
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		response.setHeader('Access-Control-Allow-Headers', 'Content-Type');		
	});
	
	this.ServerApplication = http.createServer(function(request, response) {
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	});

	// Set listening port and start listener
	this.ServerNode.listen(this.WebsocketPort, function() {
		console.log(self.ModuleName, "WSNode running on port", self.ServerNode.address().port);
	});
	
	this.ServerApplication.listen(this.WebsocketPort + 1, function() {
		console.log(self.ModuleName, "WSApplication running on port", self.ServerApplication.address().port);
	});

	// Create new websocket server running on top of created server
	this.WSNode = new WebSocketServer({
		httpServer: this.ServerNode
	});
	
	this.WSApplication = new WebSocketServer({
		httpServer: this.ServerApplication
	});
	
	// Register application websocket.
	this.WSApplication.on('request', function(request) {
		// Accept new connection request
		var connection = request.accept('echo-protocol', request.origin);
		var wsHandle = self.WSApplicationClients.push(connection) - 1;
		
		connection.on('message', function(message) {
			if (message.type === 'utf8') {
				connection.LastMessageData = message.utf8Data;
				jsonData = JSON.parse(message.utf8Data);
				
				if ("handshake" == jsonData.msg_type) {
					console.log(self.ModuleName, (new Date()), "Register new application session:", jsonData.key);
					request.httpRequest.headers.UserKey = jsonData.key;
					self.ApplicationList[jsonData.key] = new ApplicationSession(jsonData.key, connection);
				}
			}
		});
		
		connection.on('close', function(connection) {
			// Remove application session
			console.log (self.ModuleName, (new Date()), "Unregister application session:", request.httpRequest.headers.UserKey);
			delete self.ApplicationList[request.httpRequest.headers.UserKey];
			// Removing connection from the list.
			self.WSApplicationClients.splice(wsHandle, 1); // Consider to remove this list, we have a connections map.
		});
	});

	// Register node websocket to request event
	this.WSNode.on('request', function(request) {
		// Accept new connection request
		var connection = request.accept(null, request.origin);
		
		// Node must provide UUID on connection request.
		if (request.httpRequest.headers.uuid == undefined || request.httpRequest.headers.uuid == "") {
			console.log(self.ModuleName, "ERROR: Device without UUID trying to connect WebSocket ...");
			connection.send("Missing UUID");
			return;
		}
		
		// Node must provide a key.
		if (request.httpRequest.headers.key == undefined || request.httpRequest.headers.key == "") {
			console.log(self.ModuleName, "ERROR: Unrecognized user ... Key not provided.");
			connection.send("Missing KEY");
			return;
		}
		
		// TODO
		//  1. Check if uuid in database.
		// 	2. Check user key in database.
		
		self.Database.IsUuidExist(request.httpRequest.headers.uuid, function (status, data) {
			if (status) {
				self.Database.IsUserKeyExist(request.httpRequest.headers.key, function (status, data) {
					if (status) {
						console.log(self.ModuleName, (new Date()), "Register node:", request.httpRequest.headers.uuid);
						var wsHandle = self.WSNodeClients.push(connection) - 1;
						// Storing node connection into map.
						self.NodeList[request.httpRequest.headers.uuid] = new Connection(request.httpRequest.headers.uuid, connection);
						connection.on('message', function(message) {
							if (message.type === 'utf8') {
								connection.LastMessageData = message.utf8Data;
								jsonData = JSON.parse(message.utf8Data);
							}
						});
						connection.on('close', function(connection) {
							console.log (self.ModuleName, (new Date()), "Unregister node:", request.httpRequest.headers.uuid);
							self.NodeList[request.httpRequest.headers.uuid].CleanSubscribers();
							delete self.NodeList[request.httpRequest.headers.uuid];
							// Removing connection from the list.
							self.WSNodeClients.splice(wsHandle, 1); // Consider to remove this list, we have a connections map.
						});
					} else {
						return;
					}
				});
			} else {
				return;
			}
		});
	});
}

function GatewayFactory () {
    return MkSGateway;
}

module.exports = GatewayFactory;

