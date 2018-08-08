function SensorHtmlBuildNew_10002 (data) {
	var html = "";
	switch(data.sensor.type) {	
		case "Switch":
			var switchTextValue = "";
		
			if (1 == data.sensor.value) {
				switchTextValue = "On";
			} else {
				switchTextValue = "Off";
			}
		
			html = "<tr id=\"" + data.sensor.uuid + "\">" +
			"<td></td>" +
			"<td><label id=\"" + data.sensor.uuid + "-name\">" + data.sensor.name + "</label></td>" +
			"<td align=\"center\"><div onclick=\"onClickSwitch_10002('" + data.sensor.uuid + "','" + data.device.uuid + "','" + data.sensor.type + "');\"><span id=\"switch_value_" + data.sensor.uuid + "\">" + switchTextValue + "</span></div></td>" +
			"</tr>";
		break;
		default:
		break;
	}
	
	return html;
}

function SensorHtmlUpdate_10002 (data) {
	switch(data.sensor.type) {
		case "Switch":
			if (1 == data.sensor.value) {
				document.getElementById('switch_value_' + data.sensor.uuid).innerHTML = "On";
			} else {
				document.getElementById('switch_value_' + data.sensor.uuid).innerHTML = "Off";
			}
		break;
		default:
		break;
	}
}

function DataArrivedHandler_10002(data) {
	if ("get_node_sensor_info" == data.device.command) {
		console.log("get_node_sensor_info");
		if (data.payload.sensors.length > 0) {
			for (i = 0; i < data.payload.sensors.length; i++) {
				var item = {
					sensor: data.payload.sensors[i],
					device: data.device
				};
				
				if (document.getElementById(item.sensor.uuid) == null) {
					document.getElementById('switches_context_app_node_10002').innerHTML += SensorHtmlBuildNew_10002(item);
				} else {
					SensorHtmlUpdate_10002(item);
				}
			}
		}
	}
}

function onClickSwitch_10002 (uuid, node_uuid, type) {
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

function OnApplicationLoaded_10002() {
	console.log("OnApplicationLoaded_10002");
	
	/*
	 * Please note,
	 * This is an application so we must establish websoket with the gateway.
	 */
	var info = {
		key: localStorage.getItem("key"),
		url: GetServerUrl(),
	};
	MkSRegisterToSensorListener(info);
	
	MkSGetDevices(GetUserKey(), function(data) {
		// We want to query each device for its sensors.
		data.forEach(function(element) {
			console.log("Query node " + element.uuid);
			// MkSRemoveDeviceListener(element.uuid, DataArrivedHandler_10002);
			MkSAddDeviceListener(element.uuid, DataArrivedHandler_10002);
			MkSDeviceSendGetRequestWebface({  	url: GetServerUrl(),
												key: localStorage.getItem("key"),
												uuid: element.uuid,
												cmd: "get_node_sensor_info",
												payload: { }
											}, function (res) { });
		});
		
		console.log(data);
	});
}
