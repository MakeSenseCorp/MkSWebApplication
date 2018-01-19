function Instance() {
	self = this;
	
	this.StreamSource = null;
	this.DeviceListeners = {};
	
	return this;
}
var objInstance = Instance();

function MkSLoadModuleHtml (name, callback) {
	jQuery.ajax({
        url: "modules/" + name + ".html",
		type: "GET",
        dataType: "html",
        success: callback,
        async: false 
    });
}

function MkSLoadModuleJavascript (name, callback) {
	jQuery.ajax({
        url: "modules/" + name + ".js",
		type: "GET",
        dataType: "script",
        success: callback,
        async: false 
    });
}

function MkSRegisterToSensorListener(obj) {
	if (!!window.EventSource) {
		console.log ((new Date()) + " #> Registered to sensor stream [" + obj.key + "]");
		objInstance.StreamSource = new EventSource(obj.url + "register_devices_update_event/" + obj.key);
		
		objInstance.StreamSource.addEventListener('message', function(e) {
			if (e.data != null) {
				var jsonData = JSON.parse(e.data);
				if (jsonData.device != null) {
					listeners = objInstance.DeviceListeners[jsonData.device.uuid];
					for (var index in listeners) {
						listener = listeners[index];
						listeners.splice(listeners.indexOf(listener), 1);
						listener(jsonData);
					}
				}
			}
		}, false);

		objInstance.StreamSource.addEventListener('open', function(e) {
			console.log((new Date()) + " #> OPEN");
		}, false);

		objInstance.StreamSource.addEventListener('error', function(e) {
			console.log((new Date()) + " #> ERROR");
			if (e.readyState == EventSource.CLOSED) {

			}
		}, false);
	} else {
		console.log ((new Date()) + " #> [ERROR] Resister to sensor stream [" + obj.key + "]");
	}
}

function MkSAddDeviceListener(deviceUuid, fn) {
	var listners = objInstance.DeviceListeners[deviceUuid];
	if (listners == undefined) {
		listners = [];
	}
	
	listners.push(fn);
	objInstance.DeviceListeners[deviceUuid] = listners;
}

function MkSRemoveDeviceListener(deviceUuid, fn) {
	var listeners = objInstance.DeviceListeners[deviceUuid];
	if (listeners != undefined) {
		listeners.splice(listeners.indexOf(fn), 1);
	}
}

function MkSUpdateDeviceOnServer(obj, callback) {
	$.ajax({
	    url: obj.url + 'update/device/' + obj.key + "/" + obj.uuid + "/" + obj.name + "/" + obj.description + "/" + obj.enable,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}

function MkSDeviceStatus(obj, callback) {
	$.ajax({
	    url: obj.url + 'get/device/node/status/' + obj.key + "/" + obj.uuid,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}

function MkSDeviceSendGetRequest(obj, callback) {
	request = {
		request: "direct",
		data: {
			key:obj.key,
			device: {
				cmd:obj.cmd
			},
			payload: obj.payload
		}
	};
	$.ajax({
	    url: obj.url + 'cmd/device/node/direct/' + obj.key + "/" + obj.uuid + "/" + JSON.stringify(request),
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}

function MkSUpdateSensorValue (obj, callback) {
	$.ajax({
	    url: obj.url + 'update/sensor/basic/value/' + obj.key + '/' + obj.deviceUuid + '/' + obj.sensorUuid + '/' + obj.value,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}

function MkSGetUserBasicSensorsByDevice(obj, callback) {
	$.ajax({
	    url: obj.url + 'select/sensor/basic/' + obj.key + "/" + obj.uuid,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}

function MkSGetUserBasicSensorsFromCacheByDevice(obj, callback) {
	$.ajax({
	    url: obj.url + 'get/sensor/basic/' + obj.key + "/" + obj.uuid,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}
