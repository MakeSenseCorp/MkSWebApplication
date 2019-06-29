/*
 * All these methods below are required to be defined.
 */

function GetNodeInformation_10000(uuid) {
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

function GetNodeStatus_10000() {
	console.log("GetNodeStatus_10000");
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: Context_10000.uuid,
										cmd: "get_node_status",
										payload: { }
									}, function (res) { });
}

function SensorHtmlBuildNew_10000 (data) {
	var html = "<tr>" +
			"<td>" + (i + 1) + "</td>" +
			"<td><img width=\"25px\" src=\"../images/basic_sensors/humidity.png\"/></td>" +
			"<td><label id=\"" + data.sensor.uuid + "-name\">" + data.sensor.name + "</label></td>" +
			"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + data.sensor.uuid + "\">" + data.sensor.value + "</em></span></td>" +
			"</tr>";
	
	return html;
}

function SensorHtmlUpdate_10000 (data) {
	switch(data.sensor.type) {
		case "Switch":
			if (1 == data.sensor.value) {
				document.getElementById('switch_value_' + data.sensor.uuid).innerHTML = "On";
			} else {
				document.getElementById('switch_value_' + data.sensor.uuid).innerHTML = "Off";
			}
		break;
		case "GenericSensor":
			document.getElementById(data.sensor.uuid).innerHTML = data.sensor.value;
		break;
		default:
		break;
	}
}

function DataArrivedHandler_10000(data) {
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
				if (document.getElementById(item.sensor.uuid) == null) {
					document.getElementById(data.device.uuid + '-modal-node-sensors').innerHTML += SensorHtmlBuildNew_10000(item);
				} else {
					SensorHtmlUpdate_10000(item);
				}
			}
		}
	} else if ("set_node_sensor_info" == data.device.command) {
		console.log("set_node_sensor_info");
	} else {
		console.log("unknown");
	}
}

function onClickSaveConfiguration_10000 (uuid, node_uuid, type) {
	var SwitchValue = "0";
	if (document.getElementById('switch_value_' + uuid).innerHTML == "On") {
		SwitchValue = "0";
	} else {
		SwitchValue = "1";
	}
	
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: node_uuid,
										cmd: "set_node_sensor_info",
										payload: {
											sensors:[
												{
													uuid: uuid,
													value: SwitchValue,
													type: type
												}
											]
										}, 
									}, function (res) { });
}

function OpenInfoModalWindow_Device_10000(uuid) {
	var self = this;	
	
	MkSRemoveDeviceListener(uuid, DataArrivedHandler_10000);
	MkSAddDeviceListener(uuid, DataArrivedHandler_10000);
	
	MkSOpenDeviceModal(uuid);
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: uuid,
										cmd: "get_node_sensor_info",
										payload: { }
									}, function (res) { });
}

function OnDeviceLoaded_10000(uuid) {
	MkSAddDeviceListener(uuid, DataArrivedHandler_10000);
	GetNodeInformation_10000(uuid);
}
