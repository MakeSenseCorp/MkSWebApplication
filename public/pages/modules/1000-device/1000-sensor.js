function ConstructSensors(data) {
	if (data.payload.sensors.length > 0) {
		if (document.getElementById('dashboard-sensor-area-' + data.device.uuid).innerHTML == "") {
			html = "<div class=\"table-responsive\">" +
			"<table class=\"table table-hover\"><tbody>";
			for (i = 0; i < data.payload.sensors.length; i++) {
				var sensor = data.payload.sensors[i];
				switch(sensor.type) {
					case 1:
						if (ConvertBoleanToJavascript(sensor.is_on_dashboard) == true) {
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/temperature_good.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\" onclick=\"OpenSensorInfoModalWindow_Device_1000('" + data.device.uuid + "','" + sensor.uuid + "');\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> C</span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">Yes</span></td>" +
							"</tr>";
						}
					break;
					case 2:
						if (ConvertBoleanToJavascript(sensor.is_on_dashboard) == true) {
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/humidity.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\" onclick=\"OpenSensorInfoModalWindow_Device_1000('" + data.device.uuid + "','" + sensor.uuid + "');\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> %</span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">Yes</span></td>" +
							"</tr>";
						}
					break;
					case 3:
						if (ConvertBoleanToJavascript(sensor.is_on_dashboard) == true) {
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/luminance.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\" onclick=\"OpenSensorInfoModalWindow_Device_1000('" + data.device.uuid + "','" + sensor.uuid + "');\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> %</span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">Yes</span></td>" +
							"</tr>";
						}
					break;
					case 4:
						if (ConvertBoleanToJavascript(sensor.is_on_dashboard) == true) {
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"30px\" src=\"../images/basic_sensors/switch.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\" onclick=\"OpenSensorInfoModalWindow_Device_1000('" + data.device.uuid + "','" + sensor.uuid + "');\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><div onclick=\"onClickSwitch('" + sensor.uuid + "','" + data.device.uuid + "');\"><input id=\"" + sensor.uuid + "_toggle\" type=\"checkbox\" data-toggle=\"toggle\" data-onstyle=\"success\" value=\"" + sensor.value + "\" data-offstyle=\"danger\"></div></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">Yes</span></td>" +
							"</tr>";
						}
					default:
					break;
				}
			} html += "</tbody></table></div>";
			document.getElementById('dashboard-sensor-area-' + data.device.uuid).innerHTML = html;
			// Loading HTML reaponsibale for sensor info modal window.
			MkSLoadModuleHtml(data.device.type + "-device" + "/private/sensor-info", function (html) {
				htmlData = html;
				htmlData = htmlData.split("[DEVICE_UUID]").join(data.device.uuid);
				document.getElementById('dashboard-sensor-area-' + data.device.uuid).innerHTML += htmlData;
			});
		}

		for (var index in data.payload.sensors) {
			sensor = data.payload.sensors[index];
			
			if (ConvertBoleanToJavascript(sensor.is_on_dashboard) == true) {
				if (sensor.type == 4) {
					if (document.getElementById(sensor.uuid + '_toggle') == undefined) {
						MkSRemoveDeviceListener(data.device.uuid, GetSensorsData_Handler);
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
						MkSRemoveDeviceListener(data.device.uuid, GetSensorsData_Handler);
						return;
					}
				
					document.getElementById(sensor.uuid).innerHTML = sensor.value;
				}
			}
		}
	}
}

function ConvertBoleanForPython(bool) {
	if (bool == true) {
		return "True";
	} else {
		return "False";
	}
}

function ConvertBoleanToJavascript(bool) {
	if (bool == "True") {
		return true;
	} else {
		return false;
	}
}

var CurrentSensorUuid = ""
function OpenSensorInfoModalWindow_Device_1000(device_uuid, sensor_uuid) {
	var self = this;
	console.log("OpenSensorInfoModalWindow_Device_1000(" + sensor_uuid + ")");
	
	CurrentSensorUuid = sensor_uuid;
	// TODO - Fill the modal window with content.
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: device_uuid,
								cmd: "get_sensor_info",
								payload: {
								}, 
							}, function (res) { });
							
	
	$('#' + device_uuid + '-modal-sensor-info').modal('show');
}

function onClickSwitch (sesnorUuid, deviceUuid, value) {
	var currentValue = document.getElementById(sesnorUuid + '_toggle').value;
	if (currentValue == 1) {
		document.getElementById(sesnorUuid + '_toggle').value = 0;
	} else {
		document.getElementById(sesnorUuid + '_toggle').value = 1;
	}
	
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: deviceUuid,
								cmd: "set_device_sensors",
								payload: {
									sensors:[
										{
											uuid: sesnorUuid,
											value: document.getElementById(sesnorUuid + '_toggle').value
										}
									]
								}, 
							}, function (res) { });
}

function GetSensorsData_Handler(data) {
	MkSAddDeviceListener(data.device.uuid, GetSensorsData_Handler);
	if (data.device.cmd == "get_device_info") {
		ConstructSensors(data);
	} else if (data.device.cmd == "get_device_sensors") {
		ConstructSensors(data);
	} else if (data.device.cmd == "get_sensor_info") {
		for (var index in data.payload.sensors) {
			sensor = data.payload.sensors[index];
			if (sensor.uuid == CurrentSensorUuid) {
				document.getElementById(data.device.uuid + '-sensor-name').value 				= sensor.name;
				document.getElementById(data.device.uuid + "-sensor-is-favorite").checked 		= ConvertBoleanToJavascript(sensor.is_on_dashboard);
				document.getElementById(data.device.uuid + "-sensor-update-value-range").value 	= sensor.value_change_range;
			}
		}
	}
}

function UpdateSensorInfo_Device_1000 (uuid) {
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "set_sensor_info",
								payload: {
									uuid: CurrentSensorUuid,
									name: document.getElementById(uuid + '-sensor-name').value,
									value_change_range: document.getElementById(uuid + "-sensor-update-value-range").value,
									is_on_dashboard: ConvertBoleanForPython(document.getElementById(uuid + "-sensor-is-favorite").checked)
								}, 
							}, function (res) {
								$('#generic-modal-update-sucess').modal('show');
							 	$('#' + uuid + '-modal-sensor-info').modal('hide');
								ResetPage();
							});
}

function OnDeviceLoaded_1000(uuid) {
	MkSRemoveDeviceListener(uuid, GetSensorsData_Handler);
	MkSAddDeviceListener(uuid, GetSensorsData_Handler);
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "get_device_info",
								payload: { }, 
							}, function (res) { });
}