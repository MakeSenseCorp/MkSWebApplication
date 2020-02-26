// Import section
var express     	= require('express');
var bodyParser  	= require('body-parser')
var WebSocketServer = require('websocket').server;
var WebSocketCloud  = require('websocket').client;
var http            = require('http');

function Connection (uuid, sock) {
	self = this;
	
	this.Socket 		= sock;
	this.UUID 			= uuid;
	this.Node 			= {
		type: 0,
		name: ""
	};

	return this;
}

function ApplicationSession (info) {
	self = this;
	
	this.Socket 		= info.sock;
	this.Key 			= info.key;
	this.LastPacket 	= info.last_packet;
	this.WebfaceIndexer	= info.webface_indexer;
	this.Additional 	= info.additional;
	
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
	this.WebfaceIndexer 		= 0;

	this.Ticker 				= 0;
	this.ConnectingTimeout 		= 0;
	this.CloudSocketState 		= "DISCONNECTED";
	this.CloudClient 			= new WebSocketCloud({
		closeTimeout: 5000
	});
	this.CloudConnection 		= null;
	this.CloudUserKey 			= "ac6de837-7863-72a9-c789-a0aae7e9d93e";
	this.CloudURL 				= "ec2-54-188-199-33.us-west-2.compute.amazonaws.com";
	this.CloudPort 				= "443";
	this.WebfaceIndexerList 	= []
	
	// Monitoring
	this.KeepaliveMonitor	= 0;
	
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
	
	// Each 10 minutes send keepalive packet
	this.KeepaliveMonitor = setInterval(this.KeepAliveMonitorHandler.bind(this), 10 * 60 * 1000);

	// Each 10 second print connected sessions
	this.SessionsMonitor = setInterval(this.SessionsMonitorHandler.bind(this), 10 * 1 * 1000);

	// Each 1 seconds state machine manager
	this.CloudConnectionStateMachineManager = null;
	
	return this;
}

MkSGateway.prototype.SetDatabaseInstance = function (db) {
	this.Database = db;
}

MkSGateway.prototype.InitRouter = function (server) {
	var self = this;
	
	server.get('/api/get/app/connections', function(req, res) {
		console.log(self.ModuleName, "/api/get/app/connections");
		var connections = [];
		for (var key in self.ApplicationList) {
			var sessions = self.ApplicationList[key];
			if (undefined !== sessions) {
				for (idx = 0; idx < sessions.length; idx++) {
					session = sessions[idx];
					session.Socket.send(JSON.stringify(jsonData));
					connections.push({uuid:session.Key});
				}
			}
		}
		res.json({error:"none", data:connections});
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
		var sessions = this.ApplicationList[key];
		if (undefined !== sessions) {
			for (idx = 0; idx < sessions.length; idx++) {
				session = sessions[idx];
				if (socket == session.Socket)
					return session;
			}
		}
	}
	
	return null;
}

MkSGateway.prototype.GetConnectionsApplicationList = function () {
	console.log(this.ModuleName, "GetConnectionsApplicationList");
}
	
MkSGateway.prototype.GetConnectionsNodeList = function () {
	console.log(this.ModuleName, "GetConnectionsNodeList");
}

MkSGateway.prototype.KeepAliveMonitorHandler = function () {
	console.log(this.ModuleName, "KeepAliveMonitorHandler");
	this.SendKeepAliveEvent();
}

MkSGateway.prototype.SessionsMonitorHandler = function () {
	console.log(this.ModuleName, "Node Connected Sessions:");
	for (key in this.NodeList) {
		var node = this.NodeList[key];
		console.log(this.ModuleName, "\t", key, node.Node.type, node.Node.name);
	}

	console.log(this.ModuleName, "Application Connected Sessions:");
	for (key in this.ApplicationList) {
		var apps = this.ApplicationList[key];
		for (var i = 0; i < apps.length; i++) {
			app = apps[i];
			console.log(this.ModuleName, "\t", key, app.WebfaceIndexer);
		}
	}
}

MkSGateway.prototype.CloudConnectionStateMachineHandler = function() {
	self = this;
	this.Ticker += 1;
	// console.log(this.ModuleName, this.Ticker);
	var payload = {
		nodes: []
	};

	if (this.CloudSocketState == "IDLE") {
		if (this.ConnectingTimeout && this.Ticker % this.ConnectingTimeout == 0) {
			this.CloudSocketState = "DISCONNECTED";
			this.ConnectingTimeout = 0;
		}
	} else if (this.CloudSocketState == "HANDSHAKE") {
		self.Database.GetNodesByUserKey(this.CloudUserKey, function(error, data) {
			if (!error) {
			} else {
				for (i = 0; i < data.data.length; i++) {
					var item = data.data[i];
					for (var key in self.NodeList) {
						if (self.NodeList.hasOwnProperty(key)) {
							node = self.NodeList[key];
							if (item.uuid == node.UUID) {
								item.online = true;
								break;
							} else {
								item.online = false;
							}
						}
					}
				}
				payload.nodes = data.data;
			}

			var packet = {
				header: {
					message_type: "HANDSHAKE",
					destination: "CLOUD",
					source: "GATEWAY",
					direction: "request"
				},
				data: {
					header: {
						command: "",
						timestamp: 0
					},
					payload: payload
				},
				user: {
					key: self.CloudUserKey
				},
				piggybag: {
					identifier: 0
				}
			}
			self.CloudConnection.sendUTF(JSON.stringify(packet));
			self.ConnectingTimeout = 5;
			self.CloudSocketState  = "CONNECTING";
		});
	} else if (this.CloudSocketState == "CONNECTING") {
		if (this.ConnectingTimeout && this.Ticker % this.ConnectingTimeout == 0) {
			this.CloudSocketState = "DISCONNECTED";
			this.CloudConnection.close();
			this.ConnectingTimeout = 0;
		}
	} else if (this.CloudSocketState == "CONNECTED") {
	} else if (this.CloudSocketState == "DISCONNECTED") {
		this.CloudClient.connect('ws://' + this.CloudURL + ':' + this.CloudPort, 'echo-protocol', this.CloudURL, {
			UserKey: this.CloudUserKey
		});
		
		this.ConnectingTimeout = 5;
	} else {
	}
}

MkSGateway.prototype.SendNodeRegistrationEvent = function (uuid, type) {
	var packet = {
		header: {
			message_type: "DIRECT",
			destination: "WEBFACE",
			source: "GATEWAY"
		},
		data: {
			header: {
				command: "node_registered",
				timestamp: 0
			},
			payload: {
				uuid: uuid,
				type: type
			}
		},
		user: {
			key: { }
		},
		additional: { },
		piggybag: {
			identifier: 0
		}
	}
	
	for (key in this.ApplicationList) {
		var sessions = this.ApplicationList[key];
		if (undefined !== sessions) {
			for (idx = 0; idx < sessions.length; idx++) {
				session = sessions[idx];
				session.Socket.send(JSON.stringify(packet));
			}
		}
	}
}

MkSGateway.prototype.SendNodeUnRegistrationEvent = function (uuid) {
	var packet = {
		header: {
			message_type: "DIRECT",
			destination: "WEBFACE",
			source: "GATEWAY"
		},
		data: {
			header: {
				command: "node_unregistered",
				timestamp: 0
			},
			payload: {
				uuid: uuid
			}
		},
		user: {
			key: { }
		},
		additional: { },
		piggybag: {
			identifier: 0
		}
	}
	
	for (key in this.ApplicationList) {
		var sessions = this.ApplicationList[key];
		if (undefined !== sessions) {
			for (idx = 0; idx < sessions.length; idx++) {
				session = sessions[idx];
				session.Socket.send(JSON.stringify(packet));
			}
		}
	}
}

MkSGateway.prototype.SendKeepAliveEvent = function (uuid) {
	var packet = {
		header: {
			message_type: "DIRECT",
			destination: "WEBFACE",
			source: "GATEWAY"
		},
		data: {
			header: {
				command: "gateway_keepalive",
				timestamp: 0
			},
			payload: { }
		},
		user: {
			key: { }
		},
		additional: { },
		piggybag: {
			identifier: 0
		}
	}
	
	for (key in this.ApplicationList) {
		var sessions = this.ApplicationList[key];
		if (undefined !== sessions) {
			for (idx = 0; idx < sessions.length; idx++) {
				session = sessions[idx];
				session.Socket.send(JSON.stringify(packet));
			}
		}
	}
}

MkSGateway.prototype.Start = function () {
	var self = this;

	this.CloudClient.on('connectFailed', function(error) {
		console.log(self.ModuleName, "[ERROR] Connection FAILED", error.toString());
	});

	this.CloudClient.on('connect', function(connection) {
		console.log(self.ModuleName, "Cloud socket connected");
		self.CloudSocketState = "HANDSHAKE";
		self.CloudConnection  = connection;

		connection.HandlerToUnique = {}
		connection.UniqueToHandler = {}

		connection.on('error', function(error) {
			console.log(self.ModuleName, "[ERROR] Cloud connection", error.toString());
		});
		connection.on('close', function() {
			console.log(self.ModuleName, "Cloud connection CLOSED");
			self.CloudSocketState = "DISCONNECTED";
		});
		connection.on('message', function(message) {
			if (message.type === 'utf8') {
				jsonData = JSON.parse(message.utf8Data);
				console.log("\n", self.ModuleName, "Cloud -> Gateway", jsonData, "\n");
				if (jsonData.header === undefined) {
					console.log(self.ModuleName, (new Date()), "Invalid request ...");
					return;
				}
				
				if (jsonData.header.message_type === undefined) {
					console.log(self.ModuleName, (new Date()), "Invalid request ...");
					return;
				}
				
				if ("HANDSHAKE" == jsonData.header.message_type) {
					if (jsonData.user.key == self.CloudUserKey) {
						// Set state machine
						self.CloudSocketState  = "CONNECTED";
						self.ConnectingTimeout = 0;
						// Handle new socket connection
						if (jsonData.data.header.command == "webface_new_connection") {
							console.log(self.ModuleName, "Cloud -> Gateway [NEW WEBFACE CONNECTION]", jsonData.piggybag.cloud.handler);
							self.WebfaceIndexer += 1;

							connection.HandlerToUnique[jsonData.piggybag.cloud.handler] = self.WebfaceIndexer;
							connection.UniqueToHandler[self.WebfaceIndexer] = jsonData.piggybag.cloud.handler;

							self.WebfaceIncome({
								connection: connection,
								message: message,
								webface_indexer: connection.HandlerToUnique[jsonData.piggybag.cloud.handler],
								additional: {
									sender: 1,
									cloud_handler: jsonData.piggybag.cloud.handler
								}
							});
						}

						console.log(self.ModuleName, "Connected to cloud ...");
					}
				} else {
					if (jsonData.header.source == "CLOUD") {
						// cloud messages handling
						if (jsonData.data.header.command == "webface_remove_connection") {
							console.log(self.ModuleName, "REMOVE CONNECTION");
							var ws_handler = jsonData.additional.cloud.handler;
							connection.UniqueToHandler[connection.HandlerToUnique[ws_handler]] = 0;
							connection.HandlerToUnique[ws_handler] = 0;

							var userSessionList = self.ApplicationList[jsonData.user.key];
							if (userSessionList !== undefined && userSessionList != null) {
								var idxToDelete = -1;
								for (var i = 0; i < userSessionList.length; i++) {
									if (userSessionList[i].Additional.cloud_handler == ws_handler) {
										idxToDelete = i;
										break;
									}
								}
								if (idxToDelete > -1) {
									userSessionList.splice(idxToDelete, 1);
									self.ApplicationList[jsonData.user.key] = userSessionList;
								}
							}
						}
					} else {
						// Handle packet
						self.WebfaceIncome({
							connection: connection,
							message: message,
							webface_indexer: connection.HandlerToUnique[jsonData.piggybag.cloud.handler],
							additional: {
								sender: 1,
								cloud_handler: jsonData.piggybag.cloud.handler
							}
						});
					}
				}
			}
		});
	});

	this.CloudConnectionStateMachineManager = setInterval(this.CloudConnectionStateMachineHandler.bind(this), 1 * 1000);
	
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

		self.WebfaceIndexer += 1;
		connection.WebfaceIndexer = self.WebfaceIndexer;

		console.log (self.ModuleName, (new Date()), "NEW SESSION:", wsHandle, request.httpRequest.headers['sec-websocket-key']);
		
		connection.on('message', function(message) {
			// Handle packet
			self.WebfaceIncome({
				request: request,
				connection: connection,
				message: message,
				webface_indexer: connection.WebfaceIndexer,
				additional: {
					sender: 2
				}
			});
		});
		
		connection.on('close', function(conn) {
			// Remove application session
			if (request.httpRequest.headers.UserKey !== undefined) {
				console.log (self.ModuleName, (new Date()), "Unregister application session:", wsHandle, request.httpRequest.headers.UserKey, request.httpRequest.headers['sec-websocket-key']);
				var sessions = self.ApplicationList[request.httpRequest.headers.UserKey];
				if (undefined !== sessions) {
					for (idx = 0; idx < sessions.length; idx++) {
						session = sessions[idx];
						if (session.Socket == connection) {
							// Send messages to nodes about this disconnection
							for (var key in self.NodeList) {
								var item = self.NodeList[key];
								var packet = {
									header: {
										message_type: "DIRECT",
										destination: item.UUID,
										source: "GATEWAY",
										direction: "request"
									},
									data: {
										header: {
											command: "unregister_on_node_change",
											timestamp: 0
										},
										payload: {
											'webface_indexer': connection.WebfaceIndexer,
											"item_type": 2
										}
									},
									user: {
										key: { }
									},
									additional: {
										pipe: "GATEWAY"
									},
									piggybag: {
										identifier: 0
									}
								}
								item.Socket.send(JSON.stringify(packet));
							}
							sessions.splice(idx, 1);
							self.ApplicationList[request.httpRequest.headers.UserKey] = sessions;
							continue;
						}
					}
				}
			} else {
				console.log (self.ModuleName, (new Date()), "ERROR (Unregister session):", wsHandle, request.httpRequest.headers['sec-websocket-key']);
			}
			// Removing connection from the list.
			self.WSApplicationClients.splice(wsHandle, 1); // Consider to remove this list, we have a connections map.
		});
	});

	// Register node websocket to request event
	this.WSNode.on('request', function(request) {
		// Accept new connection request
		var connection = request.accept(null, request.origin);
		console.log(self.ModuleName, "Accept new connection");
		
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
						mksConnection = self.NodeList[request.httpRequest.headers.uuid];
						if (mksConnection !== undefined) {
							return;
						}

						console.log(self.ModuleName, (new Date()), "Register node:", request.httpRequest.headers.uuid);
						var wsHandle = self.WSNodeClients.push(connection) - 1;
						// Storing node connection into map. (MASTER/ADMIN connection request)
						var nodeConn = new Connection(request.httpRequest.headers.uuid, connection);
						payloadJson = JSON.parse(request.httpRequest.headers.payload);
						nodeConn.Node.type = payloadJson.node_type;
						nodeConn.Node.name = payloadJson.node_name;
						self.NodeList[request.httpRequest.headers.uuid] = nodeConn;

						// If Cloud connected send list of nodes to Cloud
						if (self.CloudConnection !== undefined && self.CloudConnection != null) {
							var payload = {
								nodes: []
							};
							self.Database.GetNodesByUserKey(request.httpRequest.headers.key, function(error, data) {
								if (!error) {
								} else {
									for (i = 0; i < data.data.length; i++) {
										var nodeDB = data.data[i];
										for (var key in self.NodeList) {
											if (self.NodeList.hasOwnProperty(key)) {
												node = self.NodeList[key];
												if (nodeDB.uuid == node.UUID) {
													nodeDB.online = true;
													break;
												} else {
													nodeDB.online = false;
												}
											}
										}
									}
									payload.nodes = data.data;
								}
					
								var packet = {
									header: {
										message_type: "DIRECT",
										destination: "CLOUD",
										source: "GATEWAY",
										direction: "request"
									},
									data: {
										header: {
											command: "update_node_list",
											timestamp: 0
										},
										payload: payload
									},
									user: {
										key: request.httpRequest.headers.key
									},
									piggybag: {
										identifier: 0
									}
								}
								self.CloudConnection.sendUTF(JSON.stringify(packet));
							});
						}
						
						// Send event to all application instances about this node.
						// TODO - Proxy it via Cloaud
						self.SendNodeRegistrationEvent(request.httpRequest.headers.uuid, request.httpRequest.headers.node_type);
						
						connection.on('message', function(message) {
							if (message.type === 'utf8') {
								connection.LastMessageData = message.utf8Data;
								jsonData = JSON.parse(message.utf8Data);
								
								console.log("\n", self.ModuleName, "Node -> Application", jsonData, "\n");
								if ("HANDSHAKE" == jsonData.header.message_type) {
								} else {
									var destination = jsonData.header.destination;
									var source 		= jsonData.header.source;
									switch(jsonData.header.message_type) {
										case "DIRECT":
											if ("GATEWAY" == destination) {
												switch (jsonData.data.header.command) {
													case 'ping':
														console.log("\n", self.ModuleName, "PING from", jsonData.header.source, "\n");
													break;
													case 'nodes_list':
														console.log("\n", self.ModuleName, "NODES LIST to", jsonData.header.source, "\n");
														var uuids = [];
														for (var key in self.NodeList) {
															var item = self.NodeList[key];
															uuids.push(item.UUID);
														}
														
														var node = self.NodeList[source];
														message = {
															header: {
																message_type: "DIRECT",
																destination: source,
																source: "GATEWAY",
																direction: "response"
															},
															data: {
																header: {
																	command: "nodes_list",
																	timestamp: new Date()
																},
																payload: uuids
															},
															user: {
																key: ""
															},
															additional: "",
															piggybag: {
																identifier: 0
															}
														}

														console.log(message);
														node.Socket.send(JSON.stringify(message));
													break;
												}
											} else {
												var node = self.NodeList[destination];
												if (undefined != node) {
													node.Socket.send(JSON.stringify(jsonData));
												} else {
													if ("WEBFACE" == destination) {
														// Handling Webface sessions
														var sessions = self.ApplicationList[jsonData.user.key];
														if (undefined !== sessions) {
															var sessionFound = false;
															for (idx = 0; idx < sessions.length; idx++) {
																session = sessions[idx];
																if (session.WebfaceIndexer == jsonData.piggybag.webface_indexer) {
																	if (session.Additional.sender == 1) {
																		// Handling Cloud connection
																		console.log("\n", self.ModuleName, "Proxy message above to cloud, Handler:", session.Additional.cloud_handler, "\n");
																		if (jsonData.piggybag.cloud == undefined) {
																			jsonData.piggybag.cloud = {
																				handler: session.Additional.cloud_handler
																			};
																		} else {
																			jsonData.piggybag.cloud.handler = session.Additional.cloud_handler;
																		}
																	} else {

																	}
																	session.Socket.send(JSON.stringify(jsonData));
																	sessionFound = true;
																	continue;
																}
															}

															if (sessionFound == false) {
																// Send session disconnected packet
																var packet = {
																	header: {
																		message_type: "DIRECT",
																		destination: jsonData.header.source,
																		source: "GATEWAY",
																		direction: "request"
																	},
																	data: {
																		header: {
																			command: "unregister_on_node_change",
																			timestamp: 0
																		},
																		payload: {
																			'webface_indexer': jsonData.piggybag.webface_indexer,
																			"item_type": 2
																		}
																	},
																	user: {
																		key: { }
																	},
																	additional: {
																		pipe: "GATEWAY"
																	},
																	piggybag: {
																		identifier: 0
																	}
																}
																connection.send(JSON.stringify(packet));
															}
														}
													} else if ("GATEWAY" == destination) {
														console.log("\n", self.ModuleName, "PAY ATTENTION - SOMEONE SENT MESSAGE TO GATEWAY\n");
													}
												}
											}
										break;
										case "PRIVATE":
										break;
										case "BROADCAST":
												console.log("\n", self.ModuleName, "BROADCAST message recieved\n");
											// Send to all nodes.
											for (key in self.NodeList) {
												jsonData.header.destination = key;
												self.NodeList[key].Socket.send(JSON.stringify(jsonData));
											}
											
											// Send to all application sessions.
											for (key in this.ApplicationList) {
												var sessions = this.ApplicationList[key];
												if (undefined !== sessions) {
													for (idx = 0; idx < sessions.length; idx++) {
														session = sessions[idx];
														session.Socket.send(JSON.stringify(jsonData));
													}
												}
											}
										break;
										case "GROUP":
										break;
										case "WEBFACE":
										break;
										case "CUSTOM":
										break;
										case "MASTER":
											/*
											* TODO:
												1. Monitor for connections (maybe some keepalive packet monitoring). If connection
												not responding for a while close connection and delete.
											*/
											if ("GATEWAY" == destination) {
												var master 	= self.NodeList[source];
												var payload = jsonData.data.payload;
												console.log(jsonData.data.payload); 
												switch(jsonData.data.header.command) {
													case "node_connected":
														console.log(self.ModuleName, (new Date()), "Register node:", payload.node.uuid);
														if (master) {
															var nodeConn = new Connection(payload.node.uuid, master.Socket);
															nodeConn.Node.type = payload.node.type;
															nodeConn.Node.name = payload.node.name;
															self.NodeList[payload.node.uuid] = nodeConn;
															// Send event to all application instances about this node.
															self.SendNodeRegistrationEvent(payload.node.uuid, payload.node.type);
														}
														var payload = {
															nodes: []
														};
														self.Database.GetNodesByUserKey(request.httpRequest.headers.key, function(error, data) {
															if (!error) {
															} else {
																for (i = 0; i < data.data.length; i++) {
																	var nodeDB = data.data[i];
																	nodeDB.online = false;
																	for (var key in self.NodeList) {
																		if (self.NodeList.hasOwnProperty(key)) {
																			node = self.NodeList[key];
																			if (nodeDB.uuid == node.UUID) {
																				nodeDB.online = true;
																				break;
																			} else {
																				nodeDB.online = false;
																			}
																		}
																	}
																}
																payload.nodes = data.data;
															}
												
															var packet = {
																header: {
																	message_type: "DIRECT",
																	destination: "CLOUD",
																	source: "GATEWAY",
																	direction: "request"
																},
																data: {
																	header: {
																		command: "update_node_list",
																		timestamp: 0
																	},
																	payload: payload
																},
																user: {
																	key: request.httpRequest.headers.key
																},
																piggybag: {
																	identifier: 0
																}
															}
															self.CloudConnection.sendUTF(JSON.stringify(packet));
														});
													break;
													case "node_disconnected":
														console.log (self.ModuleName, (new Date()), "Unregister node:", payload.node.uuid);
														if (self.NodeList[request.httpRequest.headers.uuid] !== undefined) {
															// Send event to all application instances about this node.
															self.SendNodeUnRegistrationEvent(payload.node.uuid);
															delete self.NodeList[payload.node.uuid];
														}
														var payload = {
															nodes: []
														};
														self.Database.GetNodesByUserKey(request.httpRequest.headers.key, function(error, data) {
															if (!error) {
															} else {
																for (i = 0; i < data.data.length; i++) {
																	var nodeDB = data.data[i];
																	nodeDB.online = false;
																	for (var key in self.NodeList) {
																		if (self.NodeList.hasOwnProperty(key)) {
																			node = self.NodeList[key];
																			if (nodeDB.uuid == node.UUID) {
																				nodeDB.online = true;
																				break;
																			} else {
																				nodeDB.online = false;
																			}
																		}
																	}
																}
																payload.nodes = data.data;
															}
												
															var packet = {
																header: {
																	message_type: "DIRECT",
																	destination: "CLOUD",
																	source: "GATEWAY",
																	direction: "request"
																},
																data: {
																	header: {
																		command: "update_node_list",
																		timestamp: 0
																	},
																	payload: payload
																},
																user: {
																	key: request.httpRequest.headers.key
																},
																piggybag: {
																	identifier: 0
																}
															}
															self.CloudConnection.sendUTF(JSON.stringify(packet));
														});
													break;
												}
											}
										break;
										default:
										break;
									}
								}
							}
						});
						connection.on('close', function(connection) {
							console.log (self.ModuleName, (new Date()), "Unregister node:", request.httpRequest.headers.uuid);
							// Send event to all application instances about this node.
							self.SendNodeUnRegistrationEvent(request.httpRequest.headers.uuid);
							// TODO - Delete all nodes connection related to this master
							if (self.NodeList[request.httpRequest.headers.uuid] !== undefined) {
								delete self.NodeList[request.httpRequest.headers.uuid];
							} else {
								console.log (self.ModuleName, (new Date()), "ERROR unregistering Node:", request.httpRequest.headers.uuid);
							}
							// Removing connection from the list.
							self.WSNodeClients.splice(wsHandle, 1); // Consider to remove this list, we have a connections map.
							var payload = {
								nodes: []
							};
							self.Database.GetNodesByUserKey(request.httpRequest.headers.key, function(error, data) {
								if (!error) {
								} else {
									for (i = 0; i < data.data.length; i++) {
										var nodeDB = data.data[i];
										nodeDB.online = false;
										for (var key in self.NodeList) {
											if (self.NodeList.hasOwnProperty(key)) {
												node = self.NodeList[key];
												if (nodeDB.uuid == node.UUID) {
													nodeDB.online = true;
													break;
												} else {
													nodeDB.online = false;
												}
											}
										}
									}
									payload.nodes = data.data;
								}
					
								var packet = {
									header: {
										message_type: "DIRECT",
										destination: "CLOUD",
										source: "GATEWAY",
										direction: "request"
									},
									data: {
										header: {
											command: "update_node_list",
											timestamp: 0
										},
										payload: payload
									},
									user: {
										key: request.httpRequest.headers.key
									},
									piggybag: {
										identifier: 0
									}
								}
								self.CloudConnection.sendUTF(JSON.stringify(packet));
							});
						});
					} else {
						return;
					}
				});
			} else {
				console.log (self.ModuleName, (new Date()), "ERROR Node is not in DB:", request.httpRequest.headers.uuid); 
				return;
			}
		});
	});
}

MkSGateway.prototype.WebfaceIncome = function (info) {
	var self = this;

	if (info.message.type === 'utf8') {
		jsonData = JSON.parse(info.message.utf8Data);
		console.log(self.ModuleName, "Application -> Node", jsonData);
		
		if ("HANDSHAKE" == jsonData.header.message_type) {
			console.log(self.ModuleName, (new Date()), "Register new application session:", jsonData.user.key);

			if (info.additional.sender == 2) {
				info.request.httpRequest.headers.UserKey = jsonData.user.key;
			}
			
			var userSessionList = self.ApplicationList[jsonData.user.key];
			if (undefined === userSessionList) {
				userSessionList = []
			}

			userSessionList.push(new ApplicationSession({
				key: jsonData.user.key, 
				sock: info.connection,
				last_packet: info.message.utf8Data,
				webface_indexer: info.webface_indexer,
				additional: info.additional
			}));
			self.ApplicationList[jsonData.user.key] = userSessionList;
		} else {
			var destination = jsonData.header.destination;
			if (jsonData.stamping == undefined) {
				jsonData.stamping = [];
			}
			jsonData.stamping.push("gateway_t");
			switch(jsonData.header.message_type) {
				case "DIRECT":
					var node = self.NodeList[destination];
					if (undefined != node) {
						jsonData.piggybag.webface_indexer = info.webface_indexer;
						jsonData.additional.pipe = "GATEWAY";
						node.Socket.send(JSON.stringify(jsonData));
					}
				break;
				case "PRIVATE":
				break;
				case "BROADCAST":
					// Send to all nodes.
					for (key in self.NodesList) {
						self.NodesList[key].Socket.send(JSON.stringify(jsonData));
					}
				break;
				case "GROUP":
				break;
				case "WEBFACE":
				break;
				case "CUSTOM":
				break;
				default:
				break;
			}
		}
	}
}

function GatewayFactory () {
    return MkSGateway;
}

module.exports = GatewayFactory;
