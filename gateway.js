// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var WebSocketServer = require('websocket').server;
var http            = require('http');

function MkSGateway (gatewayInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 		= "[Gateway]#"
	this.WebsocketPort 		= gatewayInfo.WsPort;
	this.RestAPIPort 		= gatewayInfo.RestAPIPort;
	this.WSClients 			= [];
	this.Server 			= null;
	this.WS 				= null;
	this.RestApi 			= express();
	
	this.RestApi.use(bodyParser.json());
	this.RestApi.use(bodyParser.urlencoded({ extended: true }));
	
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
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
		
		// Each Node must provide UUID on connection request.
		if (request.httpRequest.headers.uuid == undefined || request.httpRequest.headers.uuid == "") {
			console.log(this.ModuleName, "ERROR: Device without UUID trying to connect WebSocket ...");
			connection.send("Missing UUID");
			return;
		}
		
		// TODO
		//  1. Check if device registered in database.
		// 	2. Check for user key.

		console.log(this.ModuleName, "Registering device: " + request.httpRequest.headers.uuid)
	});
}

function GatewayFactory () {
    return MkSGateway;
}

module.exports = GatewayFactory;
