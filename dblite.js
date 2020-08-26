// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var http            = require('http');
var moment 			= require('moment');
var fs              = require('fs');

function MkSDatabase (databaseInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 		= "[Database]#";
	this.RestAPIPort 		= databaseInfo.RestAPIPort;
	this.RestApi 			= express();
    this.DB 			    = null;
    this.UserDB 			= null;
	this.UuidDB 			= null;
    
    var dbFile = fs.readFileSync('./dblite.json', 'utf8');
    this.DB = JSON.parse(dbFile)["db"];
	
	this.InitUuidDatabase();
	this.InitUserDatabase();

	this.RestApi.use(bodyParser.json());
	this.RestApi.use(bodyParser.urlencoded({ extended: true }));

	this.RestApi.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});
	
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
}

/* UUID DB */

MkSDatabase.prototype.InitUuidDatabase = function () {
    var self = this;

    this.UuidDB = this.DB.uuids.list;
    console.log(self.ModuleName, "UUID Database\n", this.UuidDB);
}

MkSDatabase.prototype.IsUuidExist = function (uuid, callback) {
    var self 	= this;
    
    for (var index = 0; index < this.UuidDB.length; index++) {
        item = this.UuidDB[index];
        if (item.uuid == uuid) {
            callback (true, {
                status:"OK", 
                data:{
                    user_id: item.user_id,
                    is_valid: item.is_valid,
                    last_used_timestamp: item.last_used_timestamp
                }
            });
            return;
        }
    }

    callback (false, null);
}

MkSDatabase.prototype.GetNodesByUserKey = function (user_key, callback) {
    var self 	= this;
    var uuids   = [];
    var user_id = 0;

    // Find user id
    for (var index = 0; index < this.UuidDB.length; index++) {
        if (self.UserDB[index].key == user_key) {
            user_id = self.UserDB[index].id;
            break;
        }
    }

    if (0 == user_id) {
        callback (false, null);
        return;
    }

    for (var index = 0; index < this.UuidDB.length; index++) {
        item = this.UuidDB[index];
        if (item.user_id == user_id) {
            uuids.push(item);
        }
    }

    if (uuids.length > 0) {
        callback (true, {
            status: "OK", 
            data: uuids
        });
        return;
    } else {
        callback (false, null);
    }
}

MkSDatabase.prototype.GetNodesByUserId = function (user_id, callback) {
    var self 	= this;
    var uuids   = []

    for (var index = 0; index < this.UuidDB.length; index++) {
        item = this.UuidDB[index];
        if (item.user_id == user_id) {
            uuids.push(item);
        }
    }

    if (uuids.length > 0) {
        callback (true, {
            status: "OK", 
            data: uuids
        });
        return;
    } else {
        callback (false, null);
    }
}

MkSDatabase.prototype.AddNewNode = function() {

}

MkSDatabase.prototype.GetAllUUIDs = function (callback) {
	var self 	= this;
}

/* USER DB */

MkSDatabase.prototype.InitUserDatabase = function () {
    var self = this;
    
    this.UserDB = this.DB.users.list;
    console.log(self.ModuleName, "User Database\n", this.UserDB);
}

MkSDatabase.prototype.IsUserKeyExist = function (key, callback) {
    var self 	= this;
    
    for (var index = 0; index < this.UserDB.length; index++) {
        item = this.UserDB[index];
        if (item.key == key) {
            callback (true, {
                status:"OK", 
                data:{
                    last_login_ts: item.last_login_ts,
                    enabled: item.enabled
                }
            });
            return;
        }
    }

    callback (false, null);
}

MkSDatabase.prototype.LoginCheck = function (user, pwd, callback) {
    var self 	= this;
    
    for (var index = 0; index < this.UserDB.length; index++) {
        item = this.UserDB[index];
        if (item.user_name == user && item.password == pwd) {
            callback (true, {
                data:{
                    last_login_ts: item.last_login_ts,
                    enabled: item.enabled,
                    key: item.key,
                    id: item.id
                }
            });
            return;
        }
    }

    callback (false, null);
}

MkSDatabase.prototype.GetUserInfoById = function (user_id, callback) {
    var self 	= this;
    
    for (var index = 0; index < this.UserDB.length; index++) {
        item = this.UserDB[index];
        if (item.id == user_id) {
            callback (true, {
                data: item
            });
            return;
        }
    }

    callback (false, null);
}

MkSDatabase.prototype.GetUserInfoByKey = function (user_key, callback) {
    var self 	= this;
    
    for (var index = 0; index < this.UserDB.length; index++) {
        item = this.UserDB[index];
        if (item.key == user_key) {
            callback (true, {
                data: item
            });
            return;
        }
    }

    callback (false, null);
}

MkSDatabase.prototype.UpdateLastLoginTimestamp = function (user_id, callback) {
	var self 	= this;
}

MkSDatabase.prototype.SignUpUser = function (user, callback) {
	var self 	= this;
}

MkSDatabase.prototype.GetAllUsers = function (callback) {
    var self 	= this;

    if (this.UserDB.length > 0) {
        callback (this.UserDB);
    } else {
        callback (null);
    }
}

MkSDatabase.prototype.InitRouter = function (server) {
	var self = this;
	
	server.get('/api/get/uuid/all', function(req, res) {
		console.log(self.ModuleName, "/api/get/uuid/all");
		self.GetAllUUIDs(function (data) {
			res.json({error:"none", "data":data});
		});
	});
	
	server.get('/api/get/key/all', function(req, res) {
		console.log(self.ModuleName, "/api/get/key/all");
		self.GetAllUsers(function (data) {
			res.json({error:"none", "data":data});
		});
	});
	
	server.post('/api/get/user/info', function(req, res) {
		console.log(self.ModuleName, "/api/get/user/info");
		
		if (req.body.data != undefined) {
			var key = req.body.data.key;
			var id  = req.body.data.id;
			
			if (id != "" && id != undefined) {
				self.Database.GetUserInfoById(id, function (status, response) {
					if (status) {					
						res.json({error:"None", data:response.data});
					} else {
						res.json({error:"Not valid"});
					}
					return;
				});
			}
			
			if (key != "" && key != undefined) {
				self.Database.GetUserInfoByKey(id, function (status, response) {
					if (status) {					
						res.json({error:"None", data:response.data});
					} else {
						res.json({error:"Not valid"});
					}
					return;
				});
			}
		}
	});
}

function DatabaseFactory () {
    return MkSDatabase;
}

module.exports = DatabaseFactory;