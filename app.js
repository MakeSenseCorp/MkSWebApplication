var express     = require('express');
var bodyParser  = require('body-parser')
var path        = require('path');
const sqlModule = require('./modules/sqlite.js')();
const secModule = require('./modules/security.js')();
const moment    = require('moment');
var fs          = require('fs');
var shell       = require('shelljs');

var sql       = new sqlModule('database.db');
var security  = new secModule (sql);

var WebSocketServer = require('websocket').server;
var http            = require('http');

var logedInUsers = [];

var KnownOS = ["Linux", "Windows", "Mac", "iOS", "Android", "NoOS"];
var KnownBrandName = ["MakeSense-Virtual", "MakeSense"];

var app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

var Prime 	= 29; // 32416189669
var Base 	= 19;  // 32416187567
var DiffieHellmanDict = {};

var WebSSEClients 		= [];
var WebSSEClientsTable  = {}

var UserDevKey = "ac6de837-7863-72a9-c789-a0aae7e9d93e";

var server = http.createServer(function(request, response) {});
server.listen(8181, function() { });

wsServer = new WebSocketServer({
	httpServer: server
});

function LocalStorage (sql) {
	self = this;
	
	this.DB 					 = sql;
	this.UserLoaded 			 = false;
	this.SensorListDictWebSocket = {};
	this.DeviceListDictWebSocket = {};
	this.UserDictionary 		 = {};
	
	this.LoadUsers = function () {
		DB.SelectUsers (function(error, users) {
			for (i = 0; i < users.length; i++) {
				var user = {
					id: users[i].id,
					key: users[i].key,
					userName: users[i].user_name,
					password: users[i].password,
					ts: users[i].ts,
					lastLoginTs: users[i].last_login_ts,
					enabled: users[i].enabled
				};
				var obj = Object();
				obj.UserInfo = user;
				obj.UserDeviceList = []
				self.UserDictionary[users[i].key] = obj;
			}
			
			self.UserLoaded = true;
		});
	}
	
	this.LoadSensors = function (key) {
		
	}
	
	return this;
}
var Local = LocalStorage(sql);

function ObjectIoTConnection (socket, uuid) {
	self = this;
	
	this.UUID 		= uuid;
	this.Socket 	= socket;	// Websocket connection to Node.
	this.Listeners 	= [];		// List of device's UUID.

	return this;
}

function ObjectIoTClients () {
	self = this;
	
	this.ClientsTable 	= {};

	return this;
}
var iotClients = ObjectIoTClients();

function ObjectIoTBrowsers () {
	self = this;
	
	this.WebSSEClients 		= [];
	this.WebSSEClientsTable	= {};

	return this;
}
var iotBrowsers = ObjectIoTBrowsers();

var PacketsToSendList = [];
function SendPacketsFunc () {
	if (PacketsToSendList.length > 0) {
		var messageTask = PacketsToSendList.pop();
		var comm = connectivity.GetIoTClient(messageTask.uuid);
		// comm.Socket.send(messageTask.data);

		url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/cmd/device/node/direct/" + messageTask.key + "/" + messageTask.uuid + "/" + messageTask.data;
		http.get( url, function(response) {
  			response.setEncoding("utf8");
  			var body = "";
  			response.on("data", function(data) {
    			body += data;
  			});
  			response.on("end", function() {
    			body = JSON.parse(body);
    			console.log(body);
  			});
		});

		console.log("Messages send to " + messageTask.uuid);
		console.log("Messages left to send " + PacketsToSendList.length);
	}
} // var SendPacketsHandler = setInterval (SendPacketsFunc, 5000);

var RegisterRequestList = [];
function RegisterDevicesFunc () {
	if (RegisterRequestList.length > 0) {
		var task = RegisterRequestList.pop();
		var iotPublisher = GetIoTClient(task.publisher);
		if (iotPublisher !== undefined) {
			// Check if device already registered.
			for (var index in iotPublisher.Listeners) {
				if (iotPublisher.Listeners[index] == task.subscriber) {
					console.log("Registered subscriber " + task.subscriber + " to " + task.publisher);
					return;
				}
			}
			iotPublisher.Listeners.push(task.subscriber);
			console.log("Registered subscriber " + task.subscriber + " to " + task.publisher);
		} else {
			console.log("ERROR: Could not register device to a UNDEFINED publisher");
			RegisterRequestList.push(task);
		}
	}
}
// var RegisterDevicesHandler = setInterval (RegisterDevicesFunc, 5000);

function Connectivity (iotClients, iotBrowsers, localDB) {
	self = this;
	
	this.IoTClients 	= iotClients;
	this.IoTBrowsers 	= iotBrowsers;
	this.LocalDB		= localDB;

	this.AddIoTClient = function (client) {
		var iotConnection = GetIoTClient(client.UUID);
		if (iotConnection === undefined) {
			console.log("[REST API]# Device added [" + client.UUID + "]");
			this.IoTClients.ClientsTable[client.UUID] = client;
		} else {
			console.log("[REST API]# Device [" + client.UUID + "] already in cache");
		}

		return client.UUID;
	}

	this.RemoveIoTClient = function (uuid) {
		var iotConnection = this.IoTClients.ClientsTable[uuid];

		if (iotConnection !== undefined) {
			iotConnection.Listeners = [];
		}

		delete this.IoTClients.ClientsTable[uuid];
	}

	this.GetIoTClient = function (uuid) {
		return this.IoTClients.ClientsTable[uuid];
	}

	this.RegisterSubscriber = function (publisher, subscriber, callback) {
		var iotPublisher = GetIoTClient(publisher);
		if (iotPublisher !== undefined) {
			// Check if device already registered.
			for (var index in iotPublisher.Listeners) {
				if (iotPublisher.Listeners[index] == subscriber) {
					console.log("Registered subscriber " + subscriber + " to " + publisher);
					return;
				}
			}
			iotPublisher.Listeners.push(subscriber);
			console.log("Registered subscriber " + subscriber + " to " + publisher);
		} else {
			console.log("ERROR: Could not register device to a UNDEFINED publisher");
		}
	}

	this.RegisterListener = function (publisherDeviceUUID, listenerDeviceUUID, callback) {
		var task = {
			publisher: publisherDeviceUUID,
			subscriber: listenerDeviceUUID
		};
		RegisterRequestList.push(task);
		callback ({info:"registered"});
	}

	this.RegisterListenerSync = function (publisherDeviceUUID, listenerDeviceUUID) {
		var task = {
			publisher: publisherDeviceUUID,
			subscriber: listenerDeviceUUID
		};
		RegisterRequestList.push(task);
	}

	this.UnregisterListener = function (publisherDeviceUUID, listenerDeviceUUID, callback) {
		var obj = GetIoTClient(publisherDeviceUUID);
		for (var index in obj.Listeners) {
			if (obj.Listeners[index] == listenerDeviceUUID) {
				obj.Listeners.splice(index, 1);
				callback ({info:"unregistered"});
			}
		}

		callback ({error:"No registered device found", "errno":11});
	}

	this.PrintIoTClient = function () {
		console.log("*** Device List ***");
		for (var key in this.IoTClients.ClientsTable) {
			if (this.IoTClients.ClientsTable.hasOwnProperty(key)) {
				console.log ("Device UUID: " + this.IoTClients.ClientsTable[key].UUID);
			}
		}
		console.log("*** Device List ***");
	}

	this.SendDirectMessage = function (deviceUUID, message, callback) {
		var connection = GetIoTClient(deviceUUID);
		if (connection == undefined) {
			callback ({error:"Device not connected", "errno":10});
		} else {
			console.log("Message for " + deviceUUID + ".");
			connection.Socket.send(message);
			callback ({response:"direct"});
			return;
		}
	}

	this.SendDirectMessageToListeners = function (message) {
		var connection = GetIoTClient(message.source);
		if (connection == undefined) {
			return "ERROR: No client.";
		} else {
			for (var index in connection.Listeners) {
				var obj = GetIoTClient(connection.Listeners[index]);
				if (obj!== undefined) {
					if (message !== undefined) {
						console.log("[REST API]# Send to listener " + obj.UUID + " ...");
						obj.Socket.send(JSON.stringify(message));
					} else {
						console.log("[REST API]# Send to listener " + obj.UUID + " ... Message UNDEFINED");
					}
				}
			}
			return "Info: Success";
			return;
		}
	}

	return this;
}
var connectivity = Connectivity(iotClients, iotBrowsers, Local);

require('./modules/devices.js')(app, security, sql, connectivity, Local);
require('./modules/basic_sensors.js')(app, security, sql, connectivity, Local);

Local.LoadUsers ();

function StatusHandlerFunc() {
	console.log ("# *** Server status ***");
	console.log ("# User DB Loaded - " + Local.UserLoaded);
	console.log ("# *********************");
}

function DisconnectedDeviceHandlerFunc() {
	if (Local.DeviceListDictWebSocket !== undefined) {
		for (var index in Local.DeviceListDictWebSocket) {
			if (moment().unix() - Local.DeviceListDictWebSocket[index].timestamp > 4) {
				delete Local.DeviceListDictWebSocket[Local.DeviceListDictWebSocket[index].uuid];
			}
		}
	}
}

function FindUserDevice (key, uuid) {
	for (var index in Local.UserDictionary[key].UserDeviceList) {
		var item = Local.UserDictionary[key].UserDeviceList[index];
		if (item.uuid == uuid) {
			return index;
		}
	}

	return -1;
}

var DisconnectedDeviceHandler = setInterval (DisconnectedDeviceHandlerFunc, 5000);

var ws_clients = [];
// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	
	if (request.httpRequest.headers.uuid == undefined || request.httpRequest.headers.uuid == "") {
		console.log("ERROR: Device without UUID trying to connect WebSocket ...");
		connection.send("Missing UUID");
		return;
	}
	
	// TODO - Check if device registered in database.
	// TODO - Check for user key.

	console.log("[REST API]# Registering device: " + request.httpRequest.headers.uuid)
	// var index = connectivity.AddIoTClient(request.httpRequest.headers.uuid, new ObjectIoTConnection(connection, request.httpRequest.headers.uuid));
	var uuid = connectivity.AddIoTClient(new ObjectIoTConnection(connection, request.httpRequest.headers.uuid));
	var sec_index = ws_clients.push(connection) - 1;
	console.log("Payload " + request.httpRequest.headers.payload);
	var jData = JSON.parse(request.httpRequest.headers.payload);

	if (Local.UserDictionary[request.httpRequest.headers.key] === undefined) {
		console.log("ERROR: Unrecognized user ... " + request.httpRequest.headers.key);
		return;
	}

	var deviceInfo = {
		uuid: request.httpRequest.headers.uuid,
		sensors: jData
	}
	if (FindUserDevice(request.httpRequest.headers.key, request.httpRequest.headers.uuid) == -1) {
		Local.UserDictionary[request.httpRequest.headers.key].UserDeviceList.push(deviceInfo);
		console.log("Connection data saved to user DB");
	}

	connectivity.PrintIoTClient();	
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			connection.LastMessageData = message.utf8Data;
			jsonData = JSON.parse(message.utf8Data);

			// TODO - Check validity of nesessary values. Gatway MUST never fail.

			if (jsonData.data === undefined) {
				return;
			}
			
			if (jsonData.user.key === undefined) {
				return;
			}
			
			// Verifing the key from this message.
			var MassageKey = jsonData.user.key;
			if (Local.UserDictionary[MassageKey] === undefined) {
				console.log((new Date()) + " [ERROR] User with KEY " + MassageKey + " is NOT DEFINED.");
				return;
			}
			
			// Saving device in server local database for monitoring.
			jsonData.data.device.timestamp = moment().unix();
			Local.DeviceListDictWebSocket[jsonData.data.device.uuid] = jsonData.data.device;

			// Local.SensorListDictWebSocket[jsonData.data.device.uuid] = jsonData.data.payload.sensors;
			// Local.UserDictionary[MassageKey].Sensors = jsonData.data.sensors;
			// console.log("Key: " + MassageKey + ", " + jsonData.data.sensors);
			// TODO - Save to SQLite database.

			if (jsonData.message_type == "BROADCAST") {
				connectivity.SendDirectMessageToListeners(jsonData);
			} else if (jsonData.message_type == "WEBFACE") {
			} else if (jsonData.message_type == "DIRECT") {
			} else if (jsonData.message_type == "PRIVATE") {
				console.log("PRIVATE");
				connectivity.SendDirectMessage(jsonData.destination, JSON.stringify(jsonData), function (e) {

				});
				return;
			} else if (jsonData.message_type == "CUSTOM") {
				console.log("CUSTOM");
				return;
			}
			
			// Sending data to application. No check needed application will use data it needs. (user key was verified)
			WebConnections = WebSSEClientsTable[jsonData.user.key];
			if (WebConnections != undefined) {
				console.log("[INFO] Writing to WEBFACEs");
				for (var index in WebConnections) {
					WebConnections[index].session.write("data: " + JSON.stringify(jsonData.data) + "\n\n");
				}
			}
		} else if (message.type === 'binary') {
			console.log((new Date()) + 'Received Binary Message of ' + message.binaryData.length + ' bytes');
			connection.sendBytes(message.binaryData);
		}
	});

	connection.on('close', function(connection) {
		console.log ((new Date()) + " #> Session closed ...");
		connectivity.RemoveIoTClient(uuid);
		connectivity.PrintIoTClient();
		ws_clients.splice(sec_index, 1);
	});
});

app.get('/dh_sync/:mod', function (req, res) {
	console.log("dh_sync");
	var privateKey = Math.floor((Math.random() * 10) + 1);

	var dhData = {
					dh: {	
						mod: parseInt(req.params.mod),
						base: Base,
						prime: Prime,
						pk: privateKey,
						key: 0
					}
				};

	dhData.dh.key = (Math.pow(dhData.dh.mod, dhData.dh.pk)) % Prime;
	var publicKey = (Math.pow(Base, dhData.dh.pk)) % Prime;
	DiffieHellmanDict[req.params.mod] = dhData;

	console.log("Key: " + dhData.dh.key + " = " + dhData.dh.mod + " ^ " + dhData.dh.pk + " % " + Prime);
	console.log("Public: " + publicKey + " = " + Base + " ^ " + dhData.dh.pk + " % " + Prime);
	res.end(String(publicKey));
});

app.get('/register_devices_update_event/:key', function(req, res) {
	req.socket.setTimeout(Infinity);

    res.writeHead(200, {
    	'Content-Type': 'text/event-stream',
    	'Cache-Control': 'no-cache',
    	'Connection': 'keep-alive'
    });
    res.write('\n');

    console.log ((new Date()) + " #> Register to sensor stream ... " + req.params.key);

    WebSSEClients.push(	{
							addr: req.params.key, 
							session: res
						});
	WebSSEClientsTable[req.params.key] = WebSSEClients;

	req.on("close", function() {
		console.log ((new Date()) + " #> UnRegister to sensor stream ... " + req.params.key);
		delete WebSSEClientsTable[req.params.key]
	});
});

var ipAddress = "";
app.get('/set/wan/ip/:ip', function(req, res) {
	ipAddress = req.params.ip;
	res.end("OK");
});

app.get('/get/wan/ip', function(req, res) {
	res.end(ipAddress);
});

app.get('/test_sse', function(req, res) {
	WebConnection = WebSSEClients[UserDevKey];
	if (WebConnection != undefined) {
		var data = "HELLO";
		WebConnection.session.write("data: " + data);
		WebConnection.session.write("\n\n");
		console.log ((new Date()) + " #> Sending data to web client ...");
	}

	res.end("OK");
});

app.get('/test_json/:json', function(req, res) {
	console.log ("METHOD /select/users " + req.params.json);
	jsonData = JSON.parse(req.params.json);

	console.log(jsonData.device);
	console.log(jsonData.sensors);

	for (i = 0; i < jsonData.sensors.length; i++) {
		console.log(jsonData.sensors[i].id);
	}

	res.end(req.params.json);
});

app.get('/select/users/:key', function(req, res) {
	console.log ("METHOD /select/users");
	security.CheckAdmin(req.params.key, function(valid) {
		if (valid) {
			sql.SelectUsers(function(err, users){
				var data = [];
				for (i = 0; i < users.length; i++) {
					var user = {
						id: users[i].id,
						key: users[i].key,
						userName: users[i].user_name,
						password: users[i].password,
						ts: users[i].ts,
						lastLoginTs: users[i].last_login_ts,
						enabled: users[i].enabled
					};
					data.push(user);
				}
				res.json(data);
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

app.get('/insert/user/:key/:name/:password', function(req, res) {
	console.log ("METHOD /insert/user");
	security.CheckAdmin(req.params.key, function(valid) {
		if (valid) {
			var user = {
				id: 0,
				key: "0",
				userName: req.params.name,
				password: req.params.password,
				ts: moment().unix(),
				lastLoginTs: moment().unix(),
				enabled: 1
			};
			
			sql.SelectUserByNamePassword (user, function(err, existingUser) {
				if (existingUser != null) {
					res.json({error:"user exist"});
				} else {
					sql.InsertUser(user, function(err, key) {
						res.json(key);
					});
				}
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

/*
 * Delete whole user table content from database. Admin rights required.
 */
app.get('/delete/users/:key', function(req, res) {
	console.log ("METHOD /delete/users");
	security.CheckAdmin(req.params.key, function(valid) {
		if (valid) {
			sql.DeleteUsers(function(err){
				res.json(err);
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

/*
 * Delete user from database. Admin rights required.
 */
app.get('/delete/user/:key/:id', function(req, res) {
	console.log ("METHOD /delete/user");
	security.CheckAdmin(req.params.key, function(valid) {
		if (valid) {
			sql.DeleteUserById(req.params.id, function(err){
				res.json(err);
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

GetUserByNamePassword = function (username, password, callback) {
	var user = {
		id: 0,
		key: "0",
		userName: username,
		password: password,
		ts: moment().unix(),
		lastLoginTs: moment().unix(),
		enabled: 1
	};
	sql.SelectUserByNamePassword (user, function(err, existingUser) {
		if (existingUser != null) {
			callback (existingUser);
		} else {
			callback (null);
		}
	});
}

GetUserById = function (id, callback) {
	var user = {
		id: id,
		key: "0",
		userName: "",
		password: "",
		ts: moment().unix(),
		lastLoginTs: moment().unix(),
		enabled: 1
	};
	sql.SelectUserById (user, function(err, existingUser) {
		if (existingUser != null) {
			callback (existingUser);
		} else {
			callback (null);
		}
	});
}

app.get('/select/user/:key/:name/:password', function(req, res) {
	console.log ("METHOD /select/user [U/P]");
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			GetUserByNamePassword (req.params.name, req.params.password, function (user) {
				if (user != null) {
					res.json(user);
				} else {
					res.json({error:"user doesn't exist"});
				}
			});
		} else {
			security.CheckAdmin(req.params.key, function(valid) {
				if (valid) {
					GetUserByNamePassword (req.params.name, req.params.password, function (user) {
						if (user != null) {
							res.json(user);
						} else {
							res.json({error:"user doesn't exist"});
						}
					});
				} else {
					res.json({error:"security issue"});
				}
			});
		}
	});
});

app.get('/select/user/:key/:id', function(req, res) {
	console.log ("METHOD /select/user [ID]");
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			GetUserById (req.params.id, function (user) {
				if (user != null) {
					res.json(user);
				} else {
					res.json({error:"user doesn't exist"});
				}
			});
		} else {
			security.CheckAdmin(req.params.key, function(valid) {
				if (valid) {
					GetUserById (req.params.id, function (user) {
						if (user != null) {
							res.json(user);
						} else {
							res.json({error:"user doesn't exist"});
						}
					});
				} else {
					res.json({error:"security issue"});
				}
			});
		}
	});
});

/*
 * Login check to MakeSense, return json object of an user.
 */
app.get('/login/:name/:password', function(req, res) {
	GetUserByNamePassword (req.params.name, req.params.password, function (user) {
		if (user != null) {
			logedInUsers.push(user);
			res.json(user);
		} else {
			res.json({error:"user doesn't exist"});
		}
	});
});

/*
 * Same as Login but without saving user.
 */
app.get('/fastlogin/:name/:password', function(req, res) {
	GetUserByNamePassword (req.params.name, req.params.password, function (user) {
		if (user != null) {
			res.json(user);
		} else {
			res.json({error:"user doesn't exist"});
		}
	});
});

/*
 * Login non-os check to MakeSense, return UUID of an user. (only for non-os devices)
 */
app.get('/login/nonos/:name/:password', function(req, res) {
	GetUserByNamePassword (req.params.name, req.params.password, function (user) {
		if (user != null) {
			logedInUsers.push(user);
			res.end("DATA\n" + user.key + "\nDATA");
		} else {
			res.json({error:"user doesn't exist"});
		}
	});
});

app.get('/nonos/select/device/:key/:uuid', function(req, res) {
	var reqDevice = {
		uuid: req.params.uuid
	};
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			sql.CheckDeviceByUUID(reqDevice, function(err, devices) {
				if (devices != null) {
					if (devices.length > 0) {
						var device = {
							id: devices[0].id,
							lastUpdateTs: devices[0].last_update_ts,
							enabled: devices[0].enabled
						};
						res.end("DATA\n" + device.id + "\nDATA");
					} else {
						res.end("DATA\nNULL\nDATA");
					}
				} else {
					res.end("DATA\nNULL\nDATA");
				}
			});  
		} else {
			res.end("security issue");
		}
	});
});

app.get('/nonos/insert/device/:key/:type/:uuid/:ostype/:osversion', function(req, res) {
	var reqDevice = {
		uuid: req.params.uuid
	};
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			sql.CheckDeviceByUUID(reqDevice, function(err, devices) {
				var device = {
					id: 0,
					type: req.params.type,
					uuid: req.params.uuid,
					osType: req.params.ostype,
					osVersion: req.params.osversion,
					lastUpdateTs: moment().unix(),
					enabled: 1
				};
						
				if (devices != null) {
					if (devices.length > 0) {
						res.end("DATA\n" + devices[0].uuid + "\nDATA");
					} else {
						sql.InsertDevice(device, function(err) {
							res.end("DATA\nOK\nDATA");
						});
					}
				} else {
					sql.InsertDevice(device, function(err) {
						res.end("DATA\nOK\nDATA");
					});
				}
			});
		} else {
			res.end("security issue");
		}
	});
});

/* 
	- Delete/Insert user need to be verified. what sql.run returns?
	- Build login page.
*/

app.get('/update/sensor/gps/:longitude/:latitude/:deviceid', function(req, res) {
	console.log ("METHOD /update/sensor/gps " + req.params.longitude + ", " + req.params.latitude);
	res.end("OK");
});

app.get('/insert/sensor/camera/:key/:deviceuuid/:type', function(req, res) {
	console.log ("METHOD /insert/sensor/camera " + req.params.deviceuuid);
	var reqDevice = {
		uuid: req.params.deviceuuid
	};
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
				if (device == null) {
					res.json({error:"no device"});
				} else {
					var reqSensor = {
						deviceId: device.id,
						type: req.params.type
					};
					sql.SelectCameraSensor(reqSensor, function(err, sensor) {
						if (sensor == null) {
							var camera = {
								id: 0,
								deviceId: device.id,
								type: req.params.type,
								imagePath: req.params.key + "/" + req.params.deviceuuid + "/camera/" + req.params.type + "/image",
								imageRecordPath: req.params.key + "/" + req.params.deviceuuid + "/camera/" + req.params.type + "/image_record",
								lastUpdateTs: moment().unix(),
								enabled: 1
							};
							try {
								sql.InsertCameraSensor(camera, function(err) {
									res.json(err);
								});
							} catch (err) {
								console.log(err);
								res.json(err);
							}
						} else {
							// TODO - Remove this error text (do use something minigfull)
							res.json({error:"Sensor exist in DB"});
						}
					});
				}
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

app.get('/select/sensor/camera/:key/:deviceuuid', function(req, res) {
	console.log ("METHOD /select/sensor/camera " + req.params.deviceuuid);
	var reqDevice = {
		uuid: req.params.deviceuuid
	};
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
				if (device == null) {
					res.json({error:"no device"});
				} else {
					sql.SelectCameraSensors(device.id, function(err, sensors) {
						if (sensors == null) {
							res.json({error:"no sensor"});
						} else {
							sensors.deviceUUID = req.params.deviceuuid;
							var responseData = {
								cameras: sensors,
								deviceUUID: req.params.deviceuuid
							}
							res.json(responseData);
						}
					});
				}
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

function rawBody(req, res, next) {
	var chunks = [];

	req.on('data', function(chunk) {
		chunks.push(chunk);
	});

	req.on('end', function() {
		var buffer = Buffer.concat(chunks);
		req.bodyLength = buffer.length;
		req.rawBody = buffer;
		next();
	});

	req.on('error', function (err) {
		console.log(err);
		res.status(500);
	});
}

app.post('/update/sensor/camera/image/:key/:deviceuuid/:type', rawBody, function(req, res) {
	console.log ("METHOD /update/camera/image " + req.params.deviceuuid);
	if (req.rawBody && req.bodyLength > 0) {
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				var reqDevice = {
					uuid: req.params.deviceuuid
				};
				sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
					if (device == null) {
					} else {
						sql.SelectCameraSensorByType(device.id, req.params.type, function(err, sensors) {
							if (sensors == null) {
							} else {
								var path = "sensors/fs/" + sensors[0].imagePath;
								shell.mkdir('-p', path);

								fs.writeFile(path + "/last.jpeg", req.rawBody, function (err) {
									if (err) {
										console.log ("ERROR " + err);
									} else {
										console.log ("IMAGE SAVED ");
									}
								});
							}
						});
					}
				});
			} else {
				res.json({error:"security issue"});
			}
		});
		res.send(200, {status: 'OK'});
	} else {
		res.json({error:"upload issue"});
	}
});

app.get('/select/sensor/camera/image/:key/:deviceuuid/:type', function (req, res) {
	console.log ("METHOD /select/sensor/camera/image " + req.params.deviceuuid);
	security.CheckUUID(req.params.key, function (valid) {
		if (valid) {
			var reqDevice = {
				uuid: req.params.deviceuuid
			};
			sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
				if (device == null) {
				} else {
					sql.SelectCameraSensorByType(device.id, req.params.type, function(err, sensors) {
						if (sensors == null) {
						} else {
							var path = "sensors/fs/" + sensors[0].imagePath;
							console.log("Read Image from FS ...");
							var img = fs.readFileSync(path + "/last.jpeg");
							var buff = new Buffer(img).toString('base64')
							res.writeHead(200, {'Content-Type': 'image/jpg' });
							res.end(buff);
							console.log("Responded to Image request ...");
						}
					});
				}
			});
		} else {
			res.json({error:"security issue"});
		}
	});
});

var server = app.listen(80, function(){
	console.log('Server listening on port 8080');
});

/*
 * TODO SECURITY
 * - [HIGH] When quering DB with user key and user id we must check if key can be used for this user id.
 * - [MID] Sql injection is not dealed.
 */