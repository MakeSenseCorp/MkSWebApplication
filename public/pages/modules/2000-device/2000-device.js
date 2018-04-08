var UserSensors_2000 = null;
var Context_2000 = {
	uuid: "",
	left_uuid: "",
	right_uuid: ""
};

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

function GetSensorsData_Handler_2000(data) {
	if (Context_2000.uuid == data.device.uuid) {
		MkSAddDeviceListener(data.device.uuid, GetSensorsData_Handler_2000);
	}
	
	if ("get_device_sensors" == data.device.command) {
		var html = "";
		var sensors = data.payload.sensors;
		for (idx = 0; idx < sensors.length; idx++) {
			var sensor = sensors[idx];
			html += "<option value=\"" + sensor.uuid + "\" data-device=\"" + data.device.uuid + "\">" + sensor.name + "</option>";
		}

		document.getElementById("sensor-selector-left").innerHTML = html;
		document.getElementById("sensor-selector-right").innerHTML = html;
		document.getElementById("sensor-selector-left").value = Context_2000.left_uuid;
		document.getElementById("sensor-selector-right").value = Context_2000.right_uuid;
	} else if ("get_device_items" == data.device.command) {
		Context_2000.left_uuid = data.payload.left;
		Context_2000.right_uuid = data.payload.right;
	}
}

function OpenInfoModalWindow_Device_2000(uuid) {
	var self = this;
	
	Context_2000.uuid = uuid;

	MkSRemoveDeviceListener(uuid, GetSensorsData_Handler_2000);
	MkSAddDeviceListener(uuid, GetSensorsData_Handler_2000);

	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: uuid,
										cmd: "get_device_items",
										payload: {}
							 }, function (res) { });

	MkSOpenDeviceModal(uuid);
	MkSDeviceGetAllOnUserKey({  url: GetServerUrl(),
								key: localStorage.getItem("key")
							}, function (res) {
							 	for (deviceIdx = 0; deviceIdx < res.length; deviceIdx++) {
									var device = res[deviceIdx];
									// Our listener should be set to destination device UUID.
									MkSAddDeviceListener(device.uuid, GetSensorsData_Handler_2000);
									// Send direct request but only WEBFACE will get the response.
									MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
																		key: localStorage.getItem("key"),
																		uuid: device.uuid,
																		cmd: "get_device_sensors",
																		payload: { }
								 	}, function (res) { });
								}
							});

	// 1. Get all sensors.
	// 2. Get assigned sensors from Node.
	// 3. Remove asigned sensors.
	// 4. Focuse on selected sensor from Node.
}

function UpdateDeviceInfo_Device_2000(uuid) {
	var leftElement = document.getElementById("sensor-selector-left");
	var rightElement = document.getElementById("sensor-selector-right");

	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "set_device_items",
								payload: {
									right_publiser_uuid: rightElement.options[rightElement.selectedIndex].dataset.device,
									left_publiser_uuid: leftElement.options[rightElement.selectedIndex].dataset.device,
									right: rightElement.options[rightElement.selectedIndex].value,
									left: leftElement.options[leftElement.selectedIndex].value
								}
							 }, function (res) {
							 	$('#generic-modal-update-sucess').modal('show');
							 });
}

function LoadDeviceInfo_Device_2000(uuid) {
	// Device loding logic should be here.
}

function OnDeviceLoaded_2000(uuid) {
	DeviceStatus(uuid);
}
