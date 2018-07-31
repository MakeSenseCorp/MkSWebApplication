var UserSensors_999 = null;
var Context_999 = {
	UUID: "",
	NodeStatusTimer: 0,
	NodeStatusInterval: 60000
};

/*
 * All these methods below are required to be defined.
 */

function GetNodeInformation_999(uuid) {
	MkSRemoveDeviceListener(uuid, DataArrivedHandler_999);
	MkSAddDeviceListener(uuid, DataArrivedHandler_999);
	
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
	
	Context_999.NodeStatusTimer = setInterval(GetNodeStatus_999, Context_999.NodeStatusInterval);
}

function GetNodeStatus_999() {
	console.log("GetNodeStatus_999");
	MkSRemoveDeviceListener(Context_999.uuid, DataArrivedHandler_999);
	MkSAddDeviceListener(Context_999.uuid, DataArrivedHandler_999);
	
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: Context_999.uuid,
										cmd: "get_node_status",
										payload: { }
									}, function (res) { });
}

function DataArrivedHandler_999(data) {
	console.log(data);
	MkSAddDeviceListener(data.device.uuid, DataArrivedHandler_999);
	if ("get_node_info" == data.device.command) {
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
			if (document.getElementById(data.device.uuid + '-modal-node-sensors').innerHTML == "") {
				html = "<div class=\"table-responsive\">" +
				"<table class=\"table table-hover\"><thead><tr><th>#</th><th>Type</th><th>Name</th><th><div style=\"text-align:center\">Value/Action</div></th><th><div style=\"text-align:center\">Favorite</div></th></tr></thead><tbody>";
				for (i = 0; i < data.payload.sensors.length; i++) {
					var sensor = data.payload.sensors[i];
					switch(sensor.type) {
						case "Switch":
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/switch.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><div onclick=\"onClickSwitch_999('" + sensor.uuid + "','" + data.device.uuid + "','" + sensor.type + "');\"><input id=\"" + sensor.uuid + "_toggle\" type=\"checkbox\" data-toggle=\"toggle\" data-onstyle=\"success\" value=\"" + sensor.value + "\" data-offstyle=\"danger\"></div></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">No</span></td>" +
							"</tr>";
						break;
						case "GenericSensor":
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/humidity.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em></span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">No</span></td>" +
							"</tr>";
						break;
						default:
						break;
					}
				} html += "</tbody></table></div>";
				document.getElementById(data.device.uuid + '-modal-node-sensors').innerHTML = html;
			}
			
			for (var index in data.payload.sensors) {
				sensor = data.payload.sensors[index];
				
				if ("Switch" == sensor.type) {
					if (document.getElementById(sensor.uuid + '_toggle') == undefined) {
						MkSRemoveDeviceListener(data.device.uuid, MkSAddDeviceListener);
						return;
					}
					
					$("#" + sensor.uuid + '_toggle').bootstrapToggle('destroy');
					if (1 == sensor.value) {
						$("#" + sensor.uuid + '_toggle').bootstrapToggle('on');
						document.getElementById(sensor.uuid + '_toggle').value = 1;
					} else {
						$("#" + sensor.uuid + '_toggle').bootstrapToggle('off');
						document.getElementById(sensor.uuid + '_toggle').value = 0;
					}
				} else {
					if (document.getElementById(sensor.uuid) == undefined) {
						MkSRemoveDeviceListener(data.device.uuid, MkSAddDeviceListener);
						return;
					}
				
					document.getElementById(sensor.uuid).innerHTML = sensor.value;
				}
			}
		}
	} else if ("set_node_sensor_info" == data.device.command) {
		console.log("set_node_sensor_info");
	} else {
		console.log("unknown");
	}
}

function onClickSwitch_999 (uuid, node_uuid, type) {
	var currentValue = document.getElementById(uuid + '_toggle').value;
	if (currentValue == 1) {
		document.getElementById(uuid + '_toggle').value = 0;
	} else {
		document.getElementById(uuid + '_toggle').value = 1;
	}
	
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: node_uuid,
										cmd: "set_node_sensor_info",
										payload: {
											sensors:[
												{
													uuid: uuid,
													value: document.getElementById(uuid + '_toggle').value,
													type: type
												}
											]
										}, 
									}, function (res) { });
}

function OpenInfoModalWindow_Device_999(uuid) {
	var self = this;	
	MkSOpenDeviceModal(uuid);
	
	MkSRemoveDeviceListener(uuid, DataArrivedHandler_999);
	MkSAddDeviceListener(uuid, DataArrivedHandler_999);
	MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
										key: localStorage.getItem("key"),
										uuid: Context_999.uuid,
										cmd: "get_node_sensor_info",
										payload: { }
									}, function (res) { });
}

function OnDeviceLoaded_999(uuid) {
	Context_999.uuid = uuid;
	GetNodeInformation_999(uuid);
}
