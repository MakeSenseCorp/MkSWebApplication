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
	this.UserCacheDB		= []; // Valid users cache database
	
	this.RestApi.use(bodyParser.json());
	this.RestApi.use(bodyParser.urlencoded({ extended: true }));
	
	this.RestApi.use(express.static(path.join(__dirname, 'public')));
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
}

MkSWebface.prototype.SetDatabaseInstance = function (db) {
	this.Database = db;
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
	
	server.post('/api/get/nodes/', function(req, res) {
		console.log(self.ModuleName, "/api/get/nodes");
		if (req.body.data != undefined) {
			var key = req.body.data.key;
		}
		res.json({error:"none"});
	});
	
	server.get('/api/get/cache/users', function(req, res) {
		console.log(self.ModuleName, "/api/get/cache/users");
		res.json({error:"None", users:self.UserCacheDB});
	});
	
	server.post('/api/login/', function(req, res) {
		console.log(self.ModuleName, "/api/login");
		
		if (req.body.data != undefined) {
			var user = req.body.data.user;
			var pwd  = req.body.data.pwd;
			
			console.log(self.ModuleName, "login", user, pwd);
			self.Database.LoginCheck(user, pwd, function (status, response) {
				if (status) {
					if (!self.IsUserCacheExist(response.data.key)) {
						self.UserCacheDB.push(response);
					}
					
					res.json({error:"None", data:response.data});
					
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
			
			console.log(self.ModuleName, "login", user, pwd);
			self.Database.LoginCheck(user, pwd, function (status, response) {
				if (status) {
					if (!self.IsUserCacheExist(response.data.key)) {
						self.UserCacheDB.push(response);
					}
					
					res.json({error:"None", data:response.data});
					
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
