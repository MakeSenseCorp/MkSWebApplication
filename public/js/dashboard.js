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
						window['OnDeviceLoaded_' + element.type](element.uuid, false);
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

function onGatewayDataArrived (data) {
	console.log(data);
}

var objStorage = Storage();
$(document).ready(function() {
	// Logout simple handler
	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});

	var api = MkSAPIBuilder.GetInstance();
	api.ConnectGateway(onGatewayDataArrived);
	api.Webface.GetUserNodeList(function (nodes) {
		// Get list of node from UUIDs database.
		console.log(nodes);
		// Foreach UUID we need to send "node_info" request.
	});
});