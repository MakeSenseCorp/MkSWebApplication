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
				/* element
				{ 
					id:3,
					userId:1,
					uuid:"ac6de837-8863-82a9-c789-b0aae7e9d93e",
					type:2000,
					brandName:"MakeSense-Arduino-Basic",
					name:"New Device",
					description:"Description",
					osType:"Linux",
					osVersion:"Unknown",
					lastUpdateTs:1519228921,
					enabled:1
				}
				*/
				if (element.uuid != "") {
					objStorage.Devices[element.uuid] = element;
					DeviceSwitch(element, function (data) {
						document.getElementById('device_context').innerHTML += data;
						window['OnDeviceLoaded_' + element.type](element.uuid);
					});
				}
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