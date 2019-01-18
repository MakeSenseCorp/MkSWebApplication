// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var http            = require('http');
var path        	= require('path');

function MkSWebface (webfaceInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 		= "[Webface]#";
	this.RestAPIPort 		= webfaceInfo.RestAPIPort;
	this.RestApi 			= express();
	this.Database 			= null;
	
	this.RestApi.use(express.static(path.join(__dirname, 'public')));
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
}

MkSWebface.prototype.SetDatabaseInstance = function (db) {
	this.Database = db;
}

MkSWebface.prototype.InitRouter = function (server) {
	var self = this;
	
	server.get('/api/get/nodes/:key', function(req, res) {
		console.log(self.ModuleName, "/api/get/nodes");
		res.json({error:"none"});
	});
}

function WebfaceFactory () {
    return MkSWebface;
}

module.exports = WebfaceFactory;
