const moment = require('moment');

module.exports = function(app, security, sql, connectivity, storage) {
	
	app.get('/select/devices/:key', function(req, res) {
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				sql.SelectDevices(function(err, devices) {
					var data = [];
					
					for (i = 0; i < devices.length; i++) {
						var device = {
							id: devices[i].id,
							userId: devices[i].user_id,
							type: devices[i].type,
							uuid: devices[i].uuid,
							lastUpdateTs: devices[i].last_update_ts,
							enabled: devices[i].enabled,
						};
						data.push(device);
					}
					res.json(data);
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	/*
	 * Return all devices with attached sensors for spwcific user key.
	 */
	app.get('/get/device/sensor/all/:key', function(req, res) {
		console.log("/get/device/all");		
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				user = storage.UserDictionary[req.params.key];
				if (user === undefined) {
					console.log("ERROR: User undefined.");
					res.json({error:"User undefined"});
				} else {
					// console.log(user.UserDeviceList);
					res.json(user.UserDeviceList);
				}
			} else {
				res.json({error:"security issue"});
			}
		});
	});

	app.get('/get/device/node/status/:key/:uuid', function(req, res) {		
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				var iotClient = connectivity.GetIoTClient(req.params.uuid);
				if (iotClient == undefined) {
					res.json({error:"Device not connected", "errno":10});
				} else {
					res.json({response:"status"});
				}
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/cmd/device/node/direct/:key/:uuid/:request', function(req, res) {
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				connectivity.SendDirectMessage(req.params.uuid, req.params.request, function(msg) {
					res.json(msg);
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});

	app.get('/select/device/:key/:uuid', function(req, res) {		
		var reqDevice = {
			uuid: req.params.uuid
		};
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				sql.CheckDeviceByUUID(reqDevice, function(err, data) {
					if (data == true) {
						sql.SelectUserByKey(req.params.key, function (err, user) {
							reqDevice.userId = user.id;
							sql.SelectDeviceByUserKey(reqDevice, function(err, device) {
								if (device == null) {
									res.json({error:"no device"});
								} else {
									res.json(device);
								}
							});
						});
					} else {
						res.json({error:"no device"});
					}
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	// TODO - Check for user key - Security issue.
	app.post('/register/device/node/listener', function(req, res) {
		var data = JSON.stringify(req.body)
		data = data.substring(2, data.length - 5)
		data = data.split('\\').join('');
		var jData = JSON.parse(data);

		security.CheckUUID(jData.key, function (valid) {
			if (valid) {
				connectivity.RegisterSubscriber(jData.payload.publisher_uuid, jData.payload.listener_uuid, function(msg) {
					console.log("[REST API]# Device " + jData.payload.listener_uuid + " request queued ...");
					res.json(msg);
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});

	app.post('/unregister/device/node/listener/:key/:publisher_uuid/:listener_uuid', function(req, res) {
		console.log("[REST API]# Unregistering device " + req.params.listener_uuid + " from " + req.params.publisher_uuid);	
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				connectivity.UnregisterListener(req.params.publisher_uuid, req.params.listener_uuid);
				res.json({info:"UnRegistered"});
			} else {
				res.json({error:"security issue"});
			}
		});
	});

	app.post ('/device/register', function (req, res) {
		var data = JSON.stringify(req.body)
		data = data.substring(2, data.length - 5)
		data = data.split('\\').join('');
		var jData = JSON.parse(data);
		
		security.CheckUUID(jData.key, function (valid) {
			if (valid) {
				sql.CheckDeviceByUUID(jData.payload, function(err, data) {
					if (data == true) {
						res.json({info:"Device registered"});
					} else {
						sql.SelectUserByKey(jData.key, function (err, user) {
							if (err.info != undefined) {
								var device = {
								id: 0,
								userId: user.id,
								type: jData.payload.type,
								uuid: jData.payload.uuid,
								lastUpdateTs: moment().unix(),
								enabled: 1
							};
							sql.InsertDevice(device, function(err) {
								if (err.info != undefined) {
									res.json({info:"New device registered"});
								} else {
									res.json({error:"Failed to register device"});
								}
							});
							} else {
								res.json(err);
							}
						});
					}
				});
			} else {
				res.json({error:"Security issue"});
			}
		});
	});
	
	app.get('/insert/device/:key/:type/:uuid', function(req, res) {
		var reqDevice = {
			uuid: req.params.uuid,
			brandName: req.params.brandname
		};
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				sql.CheckDeviceByUUID(reqDevice, function(err, data) {
					if (data == true) {
						res.json({info:"OK"});
					} else {
						sql.SelectUserByKey(req.params.key, function (err, user) {
							var device = {
								id: 0,
								userId: user.id,
								type: req.params.type,
								uuid: req.params.uuid,
								lastUpdateTs: moment().unix(),
								enabled: 1
							};
							sql.InsertDevice(device, function(err) {
								res.json(device);
							});
						});
					}
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/update/device/:key/:uuid/:enabled', function(req, res) {
		var reqDevice = {
			uuid: req.params.uuid,
			enabled: req.params.enabled
		};
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				sql.CheckDeviceByUUID(reqDevice, function(err, data) {
					if (data == true) {
						sql.UpdateDeviceInfo(reqDevice, function(err) {
							res.json(err);
						});
					} else {
						res.json({error:"FAILED"});
					}
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});

	app.get('/delete/devices/:key', function(req, res) {
		security.CheckAdmin(req.params.key, function(valid) {
			if (valid) {
				sql.DeleteDevices(function(err){
					res.json(err);
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});

}
