// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var http            = require('http');
var path        	= require('path');
var os        		= require('os');

function MkSWebface (webfaceInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 		= "[Webface]#";
	this.RestAPIPort 		= webfaceInfo.RestAPIPort;
	this.RestApi 			= express();
	this.Database 			= null;
	this.Gateway 			= null;
	this.UserCacheDB		= []; // Valid users cache database
	
	this.RestApi.use(bodyParser.json());
	this.RestApi.use(bodyParser.urlencoded({ extended: true }));

	this.RestApi.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	console.log(self.ModuleName, "Network List\n", os.networkInterfaces());
	
	this.RestApi.use(express.static(path.join(__dirname, 'public')));
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
}

MkSWebface.prototype.SetDatabaseInstance = function (db) {
	this.Database = db;
}

MkSWebface.prototype.SetGatewayInstance = function (gateway) {
	this.Gateway = gateway;
}

MkSWebface.prototype.IsUserCacheExist = function (key) {
	for (var idx = 0; idx < this.UserCacheDB.length; idx++) {
		var item = this.UserCacheDB[idx];
		if (key == item.key) {
			return true;
		}
	}
	return false;
}

MkSWebface.prototype.InitRouter = function (server) {
	var self = this;
	
	server.post('/api/get/nodes', function(req, res) {
		console.log(self.ModuleName, "/api/get/nodes");
		if (req.body.data != undefined) {
			var user_id = req.body.data.user_id;
			self.Database.GetNodesByUserId(user_id, function(error, data) {
				if (!error) {
					res.json({error:"sql error", nodes:""});
				} else {
					for (i = 0; i < data.data.length; i++) {
						var item = data.data[i];
						item.online = false;
						for (var key in self.Gateway.NodeList) {
							if (self.Gateway.NodeList.hasOwnProperty(key)) {
								node = self.Gateway.NodeList[key];
								if (item.uuid == node.UUID) {
									item.online = true;
									break;
								} else {
									item.online = false;
								}
							}
						}
					}
					console.log("Webface", data);
					res.json({error:"none", nodes:data});
				}
			});
		} else {
			res.json({error:"no post params"});
		}
	});
	
	server.get('/api/get/cache/users', function(req, res) {
		console.log(self.ModuleName, "/api/get/cache/users");
		res.json({error:"none", users:self.UserCacheDB});
	});
	
	server.post('/api/login', function(req, res) {
		console.log(self.ModuleName, "/api/login");
		
		if (req.body.data != undefined) {
			var user = req.body.data.user;
			var pwd  = req.body.data.pwd;
			
			self.Database.LoginCheck(user, pwd, function (status, response) {
				if (status) {
					if (!self.IsUserCacheExist(response.data.key)) {
						self.UserCacheDB.push(response);
					}
					
					res.json({error:"none", data:response.data});
					
					self.Database.UpdateLastLoginTimestamp(response.data.id, function (status, response) {
					});
				} else {
					res.json({error:"Not valid"});
				}
			});
		}
	});
	
	server.post('/api/signup/', function(req, res) {
		console.log(self.ModuleName, "/api/signup");
		
		if (req.body.data != undefined) {
			var user = req.body.data.user;
			var pwd  = req.body.data.pwd;
			
			self.Database.LoginCheck(user, pwd, function (status, response) {
				if (status) {
					if (!self.IsUserCacheExist(response.data.key)) {
						self.UserCacheDB.push(response);
					}
					
					res.json({error:"none", data:response.data});
					
					self.Database.UpdateLastLoginTimestamp(response.data.id, function (status, response) {
					});
				} else {
					res.json({error:"Not valid"});
				}
			});
		}
	});
}

function WebfaceFactory () {
    return MkSWebface;
}

module.exports = WebfaceFactory;
