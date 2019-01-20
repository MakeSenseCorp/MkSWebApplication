// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var http            = require('http');
var sqlite3 		= require('sqlite3').verbose();
var moment 			= require('moment');

function MkSDatabase (databaseInfo) {
	var self = this;
	// Static variables section
	this.ModuleName 		= "[Database]#";
	this.RestAPIPort 		= databaseInfo.RestAPIPort;
	this.RestApi 			= express();
	this.UserDB 			= new sqlite3.Database('user.db');
	this.UuidDB 			= new sqlite3.Database('uuid.db');
	
	this.InitUuidDatabase();
	this.InitUserDatabase();
	
	this.RestApiServer = this.RestApi.listen(this.RestAPIPort, function () {
		console.log(self.ModuleName, "RESTApi running on port", self.RestApiServer.address().port);
	});
	this.InitRouter(this.RestApi);
}

MkSDatabase.prototype.InitUuidDatabase = function () {
	var self = this;
	
	this.UuidDB.serialize(function() {
		self.UuidDB.run("CREATE TABLE IF NOT EXISTS `tbl_uuids` (" +
				"`id`					INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
				"`uuid`					VARCHAR(128) NOT NULL," +
				"`user_id`				INTEGER NOT NULL," +
				"`is_valid`        		TINYINT NOT NULL," +
				"`created_timestamp`	INTEGER NOT NULL," +
				"`last_used_timestamp`	INTEGER NOT NULL);");
	});
	
	this.UuidDB.on("error", function(error) {
		console.log(self.ModuleName, "Getting an error from UUID_DB : ", error);
	}); 
}

MkSDatabase.prototype.IsUuidExist = function (uuid, callback) {
	var self 	= this;
	var sql 	= this.UuidDB;
	
	sql.serialize(function() {
		var query = "SELECT 'OK' as status, `user_id`, `is_valid`, `last_used_timestamp` " +
					"FROM  `tbl_uuids` " +
					"WHERE `uuid` = '" + uuid + "';";

		sql.all(query, function(err, rows) {
			if (rows.length > 0) {
				if (rows[0].status == 'OK') {
					callback (true, {
						"status":"OK", 
						"data":{
							"user_id": rows[0].user_id,
							"is_valid": rows[0].is_valid,
							"last_used_timestamp": rows[0].last_used_timestamp
						}});
					return;
				}
			}
			callback (false, null);
		});
	});
}

MkSDatabase.prototype.GetAllUUIDs = function (callback) {
	var self 	= this;
	var sql 	= this.UuidDB;
	
	sql.serialize(function() {
		var query = "SELECT * FROM `tbl_uuids`;";
		sql.all(query, function(err, rows) {
			if (rows.length > 0) {
				callback (rows);
				return;
			}
			callback (null);
		});
	});
}

MkSDatabase.prototype.InitUserDatabase = function () {
	var self = this;
	
	this.UserDB.serialize(function() {
		self.UserDB.run("CREATE TABLE IF NOT EXISTS `tbl_users` (" +
				"`id`              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
				"`key`             VARCHAR(128) NOT NULL," +
				"`user_name`       VARCHAR(64) NOT NULL," +
				"`password`        VARCHAR(64) NOT NULL," +
				"`ts`              INTEGER NOT NULL," +
				"`last_login_ts`   INTEGER NOT NULL," +
				"`enabled`         TINYINT NOT NULL);");
	});
	
	this.UserDB.on("error", function(error) {
		console.log(self.ModuleName, "Getting an error from USER_DB : ", error);
	}); 
}

MkSDatabase.prototype.IsUserKeyExist = function (key, callback) {
	var self 	= this;
	var sql 	= this.UserDB;
	
	sql.serialize(function() {
		var query = "SELECT 'OK' as status, `last_login_ts`, `enabled` " +
					"FROM  `tbl_users` " +
					"WHERE `key` = '" + key + "';";

		sql.all(query, function(err, rows) {
			if (rows.length > 0) {
				if (rows[0].status == 'OK') {
					callback (true, {
						"status":"OK", 
						"data":{
							"last_login_ts": rows[0].last_login_ts,
							"enabled": rows[0].enabled
						}});
					return;
				}
			}
			callback (false, null);
		});
	});
}

MkSDatabase.prototype.GetAllUsers = function (callback) {
	var self 	= this;
	var sql 	= this.UserDB;
	
	sql.serialize(function() {
		var query = "SELECT * FROM `tbl_users`;";
		sql.all(query, function(err, rows) {
			if (rows.length > 0) {
				callback (rows);
				return;
			}
			callback (null);
		});
	});
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
}

function DatabaseFactory () {
    return MkSDatabase;
}

module.exports = DatabaseFactory;