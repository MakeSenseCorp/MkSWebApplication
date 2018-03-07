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
	$('#' + uuid + '-modal').modal('show');
}

function LoadDeviceInfo_Device_2000(uuid) {
	// Device loding logic should be here.
}

function OnDeviceLoaded_2000(uuid) {
	DeviceStatus(uuid);
}
