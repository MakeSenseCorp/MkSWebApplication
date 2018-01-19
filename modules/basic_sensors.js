const moment = require('moment');

module.exports = function(app, security, sql, iotClients, iotTable, storage) {
	
    app.get('/delete/sensor/basic/:key', function(req, res) {
		// Checking user key for validity.
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				// Get userId assoited to a key.
				sql.SelectUserByKey(req.params.key, function (err, user) {
					// Delete all sensors assoiated with userId.
					sql.DeleteBasicSensorsByUserId(user.id, function (err, sensors) {
						res.json(sensors);
					});
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/get/sensor/basic/:key/:deviceuuid', function(req, res) {
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				res.end(JSON.stringify(storage.SensorListDictWebSocket[req.params.deviceuuid]));
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/select/sensor/basic/:key', function(req, res) {
		// Checking user key for validity.
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				// Get userId assoited to a key.
				sql.SelectUserByKey(req.params.key, function (err, user) {
					// Get all sensors assoiated with userId.
					sql.SelectBasicSensorByUserId(user.id, function (err, sensors) {
						res.json(sensors);
					});
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/select/sensor/basic/:key/:deviceuuid', function(req, res) {
		// Checking user key for validity.
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				sql.SelectBasicSensorByDeviceUUID(req.params.deviceuuid, function(err, sensors) {
					res.json(sensors);
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});

	app.get('/insert/sensor/basic/:key/:deviceuuid/:uuid/:type/:value', function(req, res) {
		var reqDevice = {
			uuid: req.params.deviceuuid
		};
		
		// Checking user key for validity.
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				// Checking if device assigned to this sensor does exist.
				sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
					if (device == null) {
						res.json({error:"no device"});
					} else {
						// Checking if database already has this sensor.
						sql.SelectBasicSensorByUUID(req.params.uuid, function(err, item) {
							if (item == null && err == null) {
								var sensor = {
									id: 0,
									uuid: req.params.uuid,
									name: "New Sesnor",
									type: req.params.type,
									userId: device.userId,
									deviceId: device.id,
									value: req.params.value,
									lastUpdateTs: moment().unix(),
									enabled: 1
								};
								try {
									// Insert new sensor into database.
									sql.InsertBasicSensor(sensor, function(err) {
										res.json(err);
									});
								} catch (err) {
									console.log(err);
									res.json(err);
								}
							} else {
								// TODO - Remove this error text (do use something minigfull)
								res.json({error:"Sensor exist in DB or ERROR"});
							}
						});
					}
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/update/sensor/basic/value/:key/:deviceuuid/:uuid/:value', function(req, res) {
		// Checking user key for validity.
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				// Checking if database already has this sensor.
				sql.SelectBasicSensorByUUID(req.params.uuid, function(err, item) {
					if (err == null) {
						if (item == null) {
							res.json({error:"Sensor does not exist."});
						} else {
							// Update value of the sensor.
							sql.UpdateBasicSensorValue(req.params.uuid, req.params.value, function (err) {
								var connection = iotClients[iotTable[req.params.deviceuuid]];
								connection.send("{\"request\":\"set_sensor\",\"data\":{\"uuid\":\"" + req.params.uuid + "\",\"value\":" + req.params.value + "}}");
								res.json(err);
							});
						}
					} else {
						res.json({error:"ERROR"});
					}
				});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
}
