/*
 * All these methods below are required to be defined.
 */

function GetNodeInformation_20000(uuid) {
	console.log("Send INFO request " + uuid);
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: uuid,
										cmd: "get_node_info",
										payload: { }
									}, function (res) {
		if (res.errno !== undefined) {
			if (res.errno == 10) {
				document.getElementById(uuid + "-status-external").innerHTML = "Disconnected";
				document.getElementById(uuid + "-status-external").style.color = "red";
			}
		} else {
			document.getElementById(uuid + "-status-external").innerHTML = "Connected";
			document.getElementById(uuid + "-status-external").style.color = "green";
		}
	});
	
	// Context_10000.NodeStatusTimer = setInterval(GetNodeStatus_10000, Context_10000.NodeStatusInterval);
}

function GetNodeStatus_20000() {
	console.log("GetNodeStatus_10000");
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: Context_10000.uuid,
										cmd: "get_node_status",
										payload: { }
									}, function (res) { });
}

function SensorHtmlBuildNew_20000 (data) {
	return "";
}

function SensorHtmlUpdate_20000 (data) {
	
}

function DataArrivedHandler_20000(data) {
	if ("get_node_info" == data.device.command) {
		console.log("get_node_info " + data.device.uuid);
		var NodeIcon = data.device.type + "-device";
		document.getElementById(data.device.uuid + "-node-name").innerHTML = data.payload.name;
		document.getElementById(data.device.uuid + "-node-description").innerHTML = data.payload.description;
		document.getElementById(data.device.uuid + "-node-icon").src = "modules/" + NodeIcon + "/" + NodeIcon + ".png";
		document.getElementById(data.device.uuid + "-modal-node-name").value = data.payload.name;
		document.getElementById(data.device.uuid + "-modal-node-description").value = data.payload.description;
	} else if ("get_node_status" == data.device.command) {
		console.log("get_node_status");
	} else if ("get_node_sensor_info" == data.device.command) {
		console.log("get_node_sensor_info");
		if (data.payload.sensors.length > 0) {
			for (i = 0; i < data.payload.sensors.length; i++) {
				var item = {
					sensor: data.payload.sensors[i],
					device: data.device
				};
				console.log(item.sensor);
				document.getElementById(data.device.uuid + '-modal-node-url').value = item.sensor.url;
			}
		}
	} else if ("set_node_sensor_info" == data.device.command) {
		console.log("set_node_sensor_info " + data.device.uuid);
	} else {
		console.log("unknown");
	}
}

function SetUrl_Node_20000 (uuid) {
	/*
	TODO: Make sure URL is valid.	
	*/
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: uuid,
										cmd: "set_node_sensor_info",
										payload: {
											sensors:[
												{
													url: encodeURIComponent(document.getElementById(uuid + '-modal-node-url').value),
													command: "CMD_NONE"
												}
											]
										}, 
									}, function (res) { });
}

function SetCommand_Node_20000(uuid, player_cmd) {
	/*
	TODO: Make sure URL is valid.	
	*/
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: uuid,
										cmd: "set_node_sensor_info",
										payload: {
											sensors:[
												{
													url: encodeURIComponent(document.getElementById(uuid + '-modal-node-url').value),
													command: player_cmd
												}
											]
										}, 
									}, function (res) { });
}

function OpenInfoModalWindow_Device_20000(uuid) {
	var self = this;	
	
	MkSRemoveDeviceListener(uuid, DataArrivedHandler_20000);
	MkSAddDeviceListener(uuid, DataArrivedHandler_20000);
	
	MkSOpenDeviceModal(uuid);
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: uuid,
										cmd: "get_node_sensor_info",
										payload: { }
									}, function (res) { });
}

function OnDeviceLoaded_20000(uuid) {
	MkSRemoveDeviceListener(uuid, DataArrivedHandler_20000);
	MkSAddDeviceListener(uuid, DataArrivedHandler_20000);
	GetNodeInformation_20000(uuid);
}
