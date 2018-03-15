var UserSensors_2000 = null;

/*
 * All these methods below are required to be defined.
 */

function DeviceStatus(uuid) {
	request = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid
	};
	MkSDeviceStatus(request, function(data) {
		if (data.errno !== undefined) {
			if (data.errno == 10) {
				document.getElementById(uuid + "-status-external").innerHTML = "Disconnected";
				document.getElementById(uuid + "-status-external").style.color = "red";
			}
		} else {
			document.getElementById(uuid + "-status-external").innerHTML = "Connected";
			document.getElementById(uuid + "-status-external").style.color = "green";
		}
	});
}

function OpenInfoModalWindow_Device_2000(uuid) {
	var self = this;
	
	MkSOpenDeviceModal(uuid);
	MkSDeviceGetAllOnUserKey({  url: GetServerUrl(),
								key: localStorage.getItem("key")
							}, function (res) {
							 	UserSensors_2000 = res;

							 	var html = "";
							 	for (deviceIdx = 0; deviceIdx < UserSensors_2000.length; deviceIdx++) {
									var device = UserSensors_2000[deviceIdx];
									for (sensorIdx = 0; sensorIdx < device.sensors.length; sensorIdx++) {
										var sensor = device.sensors[sensorIdx];
										html += "<option>" + sensor.uuid + "</option>"
									}
								}

								document.getElementById("sensor-selector-left").innerHTML = html;
								document.getElementById("sensor-selector-right").innerHTML = html;
							});


	// 1. Get all sensors.
	// 2. Get assigned sensors from Node.
	// 3. Remove asigned sensors.
	// 4. Focuse on selected sensor from Node.
}

function UpdateDeviceInfo_Device_2000(uuid) {
	var leftElement = document.getElementById("sensor-selector-left");
	var rightElement = document.getElementById("sensor-selector-right");

	var leftValue = leftElement.options[leftElement.selectedIndex].value;
	var rightValue = rightElement.options[rightElement.selectedIndex].value;
	console.log(leftValue + " <-> " + rightValue);

	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "get_device_config",
								payload: { }
							 }, function (res) { });
}

function LoadDeviceInfo_Device_2000(uuid) {
	// Device loding logic should be here.
}

function OnDeviceLoaded_2000(uuid) {
	DeviceStatus(uuid);
}
