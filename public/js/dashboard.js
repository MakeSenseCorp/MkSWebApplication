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

// Gey makesense api instanse.
var api = MkSAPIBuilder.GetInstance();

function ResetPage() {
	document.getElementById('sensors_context').innerHTML = "";
	GetDevices();
}

function onGetNodeInfo (data) {
	console.log("onGetNodeInfo", data.header.source);
	api.GetNodeSensorsInfo(data.header.source);
}

function onGetNodeSensorInfo (data) {
	console.log("onGetNodeSensorInfo", data);
	payload = { 
		sensors: [
			{
				id: 3,
				domain: 1,
				value: "1",
				name: "Hello",
				description: "Sensor",
				type: "Single Switch",
				group: 255
			}
		]
	};
	api.SetNodeSensorsInfo("ac6de837-7863-72a9-c789-a0aae7e9d310", payload);
}

function onSetNodeSensorInfo (data) {
	console.log("onSetNodeSensorInfo", data);
}

function onGatewayDataArrived (data) {
	console.log("onGatewayDataArrived", data);
}

function onGatewayConnected () {
	var api = MkSAPIBuilder.GetInstance();
	// TODO - 	Consider to access Database instanse instead of Webface.
	// 			We need a state machine for communication module.
	api.Webface.GetUserNodeList(function (response) {
		// Get list of node from UUIDs database.
		console.log(response);
		console.log(response.nodes.data, response.nodes.data.length);
		for (var idx = 0; idx < response.nodes.data.length; idx++) {
			var node = response.nodes.data[idx];
			console.log(node.uuid);
			api.GetNodeInfo(node.uuid);
		}
		// Foreach UUID we need to send "node_info" request.
	});
}

var objStorage = Storage();
$(document).ready(function() {
	// Logout simple handler
	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});

	// Connect gateway.
	api.ConnectGateway();
	// Register all gateway events.
	api.Gateway.OnGetNodeInfoCallback			= onGetNodeInfo;
	api.Gateway.OnGetNodeSensorInfoCallback		= onGetNodeSensorInfo;
	api.Gateway.OnSetNodeSensorInfoCallback		= onSetNodeSensorInfo;
	api.Gateway.OnGatewayDataArrivedCallback 	= onGatewayDataArrived;
	api.Gateway.OnGatewayConnectedCallback 		= onGatewayConnected;
	// Update callback table with registered event.
	api.Gateway.UpdateCallbackTable();
});
