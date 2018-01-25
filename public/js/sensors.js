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
		async: true,
	    success: function (data) {
			data.forEach(function(element) {
				if (element.type == 1000) {
					objStorage.Devices[element.uuid] = element;
					MkSLoadModuleJavascript(element.type + "-device" + "/" + element.type + "-sensor", function(data) {
						document.getElementById('sensors_context').innerHTML += "<div id=\"dashboard-sensor-area-" + element.uuid + "\"></div>";
						window['OnDeviceLoaded_' + element.type](element.uuid, true);
					});
				}
			});
	    }
	});
}

function ResetPage() {
	document.getElementById('sensors_context').innerHTML = "";
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