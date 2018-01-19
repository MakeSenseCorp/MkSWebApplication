function Storage() {
	self = this;
	this.Devices = {};
	
	return this;
}

function GetDevices() {
	$.ajax({
	    url: GetServerUrl() + 'select/devices/' + GetUserKey(),
	    type: "GET",
	    dataType: "json",
		async: false,
	    success: function (data) {		
			data.forEach(function(element) {
				objStorage.Devices[element.uuid] = element;
				DeviceSwitch(element, function (data) {
					document.getElementById('device_context').innerHTML += data;
					window['OnDeviceLoaded_' + element.type](element.uuid);
				});
			});
	    }
	});
}

function ResetPage() {
	document.getElementById('device_context').innerHTML = "";
	GetDevices();
}

var objStorage = Storage();
$(document).ready(function() {
	LogoutHandler();
	
	var info = {
		key: localStorage.getItem("key"),
		url: GetServerUrl(),
	};
	MkSRegisterToSensorListener(info);
	// On load we need to get all user devices
	GetDevices();
});