function Storage() {
	self = this;
	this.Devices = {};
	
	return this;
}

function DeviceSwitch (node, callback) {
	self = this;
	self.Node = node;
	self.DeviceFileName = node.type + "-device";
	
	console.log(self.DeviceFileName);
	MkSLoadModuleHtml(self.DeviceFileName + "/" + self.DeviceFileName, function(data) {
		htmlData = data;
		htmlData = htmlData.split("[DEVICE_UUID]").join(self.Node.uuid);
			
		self.HtmlData = htmlData;
		MkSLoadModuleJavascript(self.DeviceFileName + "/" + self.DeviceFileName, function(data) {
			callback(self.HtmlData);
		});
	});
}

function GetDevices() {
	console.log(GetServerUrl() + 'select/devices/' + GetUserKey());
	$.ajax({
	    url: GetServerUrl() + 'select/devices/' + GetUserKey(),
	    type: "GET",
	    dataType: "json",
		async: false,
	    success: function (data) {
			console.log(data);

			data.forEach(function(element) {
				/* element
				{ 
					id:3,
					userId:1,
					uuid:"ac6de837-8863-82a9-c789-b0aae7e9d93e",
					type:2000,
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
	MkSRegisterToSensorListener(info, function(status) {
		console.log(status);
		// On load we need to get all user devices
		GetDevices();
	});
});
