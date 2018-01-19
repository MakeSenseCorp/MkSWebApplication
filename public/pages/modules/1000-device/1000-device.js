/*
 * All these methods below are required to be defined.
 */

function DeviceStatus(uuid) {
	request = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid
	};
	MkSDeviceStatus(request, function(data) {
		if (data.errno !== undefined) {
			if (data.errno == 10) {
				document.getElementById(uuid + "-status-external").innerHTML = "Disconnected";
				document.getElementById(uuid + "-status-external").style.color = "red";
			}
		} else {
			document.getElementById(uuid + "-status-external").innerHTML = "Connected";
			document.getElementById(uuid + "-status-external").style.color = "green";
		}
	});
}

function GetSensorsData_Handler(data) {
	MkSAddDeviceListener(data.device.uuid, GetSensorsData_Handler);
	if (data.device.cmd == "get_device_config") {
		console.log(data);
		document.getElementById(data.device.uuid + "-device-update_delay").value 		= data.payload.interval;
		document.getElementById(data.device.uuid + "-device-on_change_update").checked 	= ConvertBoleanToJavascript(data.payload.update_on_change);
		document.getElementById(data.device.uuid + "-device-history_log").checked 		= ConvertBoleanToJavascript(data.payload.update_local_db);
		
		if (ConvertBoleanToJavascript(data.payload.update_on_change) == true) {
			$("#" + data.device.uuid + "-device-update_delay").prop('disabled', true);
		} else {
			$("#" + data.device.uuid + "-device-update_delay").prop('disabled', false);
		}
	} else if (data.device.cmd == "set_device_config") {
		document.getElementById(data.device.uuid + "-device-update_delay").value 		= data.payload.interval;
		document.getElementById(data.device.uuid + "-device-on_change_update").checked 	= ConvertBoleanToJavascript(data.payload.update_on_change);
		document.getElementById(data.device.uuid + "-device-history_log").checked 		= ConvertBoleanToJavascript(data.payload.update_local_db);
		
		if (ConvertBoleanToJavascript(data.payload.update_on_change) == true) {
			$("#" + data.device.uuid + "-device-update_delay").prop('disabled', true);
		} else {
			$("#" + data.device.uuid + "-device-update_delay").prop('disabled', false);
		}
	} else if (data.device.cmd == "get_device_sensors") {
		if (data.payload.sensors.length > 0) {
			if (document.getElementById(data.device.uuid + '-modal-sensors').innerHTML == "") {
				html = "<div class=\"table-responsive\">" +
				"<table class=\"table table-hover\"><thead><tr><th>#</th><th>Type</th><th>Name</th><th><div style=\"text-align:center\">Value/Action</div></th><th><div style=\"text-align:center\">Favorite</div></th></tr></thead><tbody>";
				for (i = 0; i < data.payload.sensors.length; i++) {
					var sensor = data.payload.sensors[i];

					var isFavorite = "No";
					if (ConvertBoleanToJavascript(sensor.is_on_dashboard) == true) {
						isFavorite = "Yes";
					}

					switch(sensor.type) {
						case 1:
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/temperature_good.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> C</span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">" + isFavorite + "</span></td>" +
							"</tr>";
						break;
						case 2:
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/humidity.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> %</span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">" + isFavorite + "</span></td>" +
							"</tr>";
						break;
						case 3:
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"25px\" src=\"../images/basic_sensors/luminance.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> %</span></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">" + isFavorite + "</span></td>" +
							"</tr>";
						break;
						case 4:
							html += "<tr>" +
							"<td>" + (i + 1) + "</td>" +
							"<td><img width=\"30px\" src=\"../images/basic_sensors/switch.png\"/></td>" +
							"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
							"<td align=\"center\"><div onclick=\"onClickSwitch('" + sensor.uuid + "','" + data.device.uuid + "');\"><input id=\"" + sensor.uuid + "_toggle\" type=\"checkbox\" data-toggle=\"toggle\" data-onstyle=\"success\" value=\"" + sensor.value + "\" data-offstyle=\"danger\"></div></td>" +
							"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">" + isFavorite + "</span></td>" +
							"</tr>";
						default:
						break;
					}
				} html += "</tbody></table></div>";
				document.getElementById(data.device.uuid + '-modal-sensors').innerHTML = html;
			}
			
			for (var index in data.payload.sensors) {
				sensor = data.payload.sensors[index];
				
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

function OpenInfoModalWindow_Device_1000(uuid) {
	var self = this;
	$('#' + uuid + '-modal').modal('show');
	
	MkSRemoveDeviceListener(uuid, GetSensorsData_Handler);
	MkSAddDeviceListener(uuid, GetSensorsData_Handler);

	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "get_device_config",
								payload: { }
							 }, function (res) { });
	
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "get_device_sensors",
								payload: { }, 
							}, function (res) { });
}

function LoadDeviceInfo_Device_1000(uuid) {
	// Device loding logic should be here.
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

function UpdateUpdateIntervalTextbox (uuid) {
	if (document.getElementById(uuid + "-device-on_change_update").checked == true) {
		$("#" + uuid + "-device-update_delay").prop('disabled', true);
	} else {
		$("#" + uuid + "-device-update_delay").prop('disabled', false);
	}
}

function UpdateDeviceInfo_Device_1000(uuid) {
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "set_device_config",
								payload: {
									interval: document.getElementById(uuid + "-device-update_delay").value,
									update_on_change: ConvertBoleanForPython(document.getElementById(uuid + "-device-on_change_update").checked),
									update_local_db: ConvertBoleanForPython(document.getElementById(uuid + "-device-history_log").checked)
								}
							 }, function (res) {
							 	$('#generic-modal-update-sucess').modal('show');
							 	$('#' + uuid + '-modal').modal('hide');
								ResetPage();
							 });
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

function OnDeviceLoaded_1000(uuid) {
	DeviceStatus(uuid);
}
