function Storage() {
	self = this;
	this.Devices = {};
	
	return this;
}

function GetSensorsData_Handler(data) {
	console.log(data);
}

function GetDevices() {
	$.ajax({
	    url: GetServerUrl() + 'select/devices/' + GetUserKey(),
	    type: "GET",
	    dataType: "json",
		async: true,
	    success: function (data) {
			data.forEach(function(element) {
				objStorage.Devices[element.uuid] = element;
				// For each node we asking for the sensors.
				if (element.uuid != null && element.uuid != "") {
					MkSAddDeviceListener(element.uuid, GetSensorsData_Handler);
					MkSDeviceSendGetRequest({  	url: GetServerUrl(),
												key: localStorage.getItem("key"),
												uuid: element.uuid,
												cmd: "get_device_sensors",
												payload: { }, 
											}, function (res) { });
				}
			});
			console.log(objStorage.Devices);
	    }
	});
}

function ResetPage() {
	// document.getElementById('sensors_context').innerHTML = "";
	GetDevices();
}

var objStorage = Storage();
$(document).ready(function() {
	LogoutHandler();
	
	var info = {
		key: localStorage.getItem("key"),
		url: GetServerUrl(),
	}; console.log(info);
	// Must register to user broadcasts.
	MkSRegisterToSensorListener(info);
	
	// On load we need to get all user devices
	GetDevices();
});