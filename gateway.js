// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var WebSocketServer = require('websocket').server;
var http            = require('http');
var sync 			= require('synchronize');

var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;

function MkSGateway (gatewayInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 		= "[Gateway]#";
	this.WebsocketPort 		= gatewayInfo.WsPort;
	this.RestAPIPort 		= gatewayInfo.RestAPIPort;
	this.WSClients 			= [];
	this.Server 			= null;
	this.WS 				= null;
	this.RestApi 			= express();
	this.Database 			= null;
	
	this.RestApi.use(bodyParser.json());
	this.RestApi.use(bodyParser.urlencoded({ extended: true }));
	
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
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
		res.json({error:"none"});
	});
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
	this.Server = http.createServer(function(request, response) {
		
	});

	// Set listening port and start listener
	this.Server.listen(this.WebsocketPort, function() {
		
	});

	// Create new websocket server running on top of created server
	this.WS = new WebSocketServer({
		httpServer: this.Server
	});

	// Register websocket to request event
	this.WS.on('request', function(request) {
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
		
		console.log(self.ModuleName, "Registering device: " + request.httpRequest.headers.uuid)
		fiber(function() {
			var objUuid = await( self.Database.IsUuidExist(request.httpRequest.headers.uuid, defer()) );
			var objUser = await( self.Database.IsUserKeyExist(request.httpRequest.headers.key, defer()) );
			
			var wsHandle = self.WSClients.push(connection) - 1;
			connection.on('message', function(message) {
				if (message.type === 'utf8') {
					connection.LastMessageData = message.utf8Data;
					jsonData = JSON.parse(message.utf8Data);
				}
			});
			connection.on('close', function(connection) {
				console.log (self.ModuleName, (new Date()), "Session closed ...", request.httpRequest.headers.uuid);
				self.WSClients.splice(wsHandle, 1);
			});
		});
	});
}

function GatewayFactory () {
    return MkSGateway;
}

module.exports = GatewayFactory;
