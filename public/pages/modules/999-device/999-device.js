var UserSensors_999 = null;
var Context_999 = {
	uuid: ""
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

function GetSensorsData_Handler_999(data) {
	if (Context_999.uuid == data.device.uuid) {
		MkSAddDeviceListener(data.device.uuid, GetSensorsData_Handler_999);
	}
}

function OpenInfoModalWindow_Device_999(uuid) {
	var self = this;
	Context_999.uuid = uuid;

	MkSRemoveDeviceListener(uuid, GetSensorsData_Handler_999);
	MkSAddDeviceListener(uuid, GetSensorsData_Handler_999);
	MkSDeviceGetAllOnUserKey({  url: GetServerUrl(),
								key: localStorage.getItem("key")
							}, function (res) {
							 	for (deviceIdx = 0; deviceIdx < res.length; deviceIdx++) {
									var device = res[deviceIdx];
									// Our listener should be set to destination device UUID.
									MkSAddDeviceListener(device.uuid, GetSensorsData_Handler_999);
									// Send direct request but only WEBFACE will get the response.
									MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
																		key: localStorage.getItem("key"),
																		uuid: device.uuid,
																		cmd: "get_device_sensors",
																		payload: { }
								 	}, function (res) { });
								}
							});
	MkSOpenDeviceModal(uuid);
}

function LoadDeviceInfo_Device_999(uuid) {
	// Device loding logic should be here.
}

function OnDeviceLoaded_999(uuid) {
	DeviceStatus(uuid);
}
