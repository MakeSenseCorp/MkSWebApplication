function MkSGateway (key) {
	self = this;
	
	this.Key 				= key;
	this.RestAPIPort 		= 8081;
	this.WSServerPort		= 1982;
	this.RestAPIUrl 		= "http://" + MkSGlobal.MakeSenseDomain;
	this.WSServerUrl		= "ws://" + MkSGlobal.MakeSenseDomain;
	this.RestAPIFullUrl 	= this.RestAPIUrl.concat(":", this.RestAPIPort);
	this.WSServerFullURl	= this.WSServerUrl.concat(":", this.WSServerPort);
	this.WSState 			= "DISCONN";
	this.Callbacks 			= {};
	
	// Callbacks
	this.OnGatewayDataArrivedCallback 		= null;
	this.OnGetNodeInfoCallback 				= null;
	this.OnGetNodeSensorInfoCallback 		= null;
	this.OnSetNodeSensorInfoCallback 		= null;
	this.OnGatewayConnectedCallback			= null;
	
	this.Connect();
	return this;
}

MkSGateway.prototype.WSWatchdog = function () {
	
}

MkSGateway.prototype.UpdateCallbackTable = function () {
	this.Callbacks["get_node_info"] 	= this.OnGetNodeInfoCallback;
	this.Callbacks["get_sensor_info"] 	= this.OnGetNodeSensorInfoCallback;
	this.Callbacks["set_sensor_info"] 	= this.OnSetNodeSensorInfoCallback;
}

MkSGateway.prototype.Connect = function () {
	var self = this;
	
	if ("DISCONN" == this.WSState) {
		this.WS = new WebSocket(this.WSServerFullURl, ['echo-protocol']);
		this.WS.onopen = function () {
			var handshakeMsg = {
				header: {
					message_type: 'HANDSHAKE'
				},
				key: self.Key
			};
			console.log('Connected to Gateway ... Sending handshake ...', handshakeMsg);
			self.WS.send(JSON.stringify(handshakeMsg));
			self.WSState = "CONN";
			
			if (null != self.OnGatewayConnectedCallback) {
				self.OnGatewayConnectedCallback();
			}
		};
		
		this.WS.onmessage = function (event) {
			var jsonData = JSON.parse(event.data);
			var handler = self.Callbacks[jsonData.data.header.command];
			if (undefined != handler) {
				handler(event.data);
			}
			self.OnGatewayDataArrivedCallback(jsonData);
		}
		
		this.WS.onclose = function () {
			console.log("Connection closed...");
			self.WSState = "DISCONN";
		};
	}
}

MkSGateway.prototype.Send = function (type, dest_uuid, cmd, payload, additional) {
	if ("" == additional) {
		additional = {};
	}
	
	if ("" == payload) {
		payload = {};
	}
	
	request = {
		header: {
			message_type: type,
			destination: dest_uuid,
			source: "WEBFACE"
		},
		data: {
			header: {
				command: cmd,
				timestamp: Date.now()
			},
			payload: payload
		},
		user: {
			key: this.Key
		},
		additional: additional
	}
	
	this.WS.send(JSON.stringify(request));
}

MkSGateway.prototype.SetRestApi = function (url, port) {
	this.RestAPIUrl 	= url;
	this.RestAPIPort 	= port;
	this.RestAPIFullUrl = this.RestAPIUrl.concat(':', this.RestAPIPort);
}

var MkSGatewayBuilder = (function () {
	var Instance;

	function CreateInstance (key) {
		var obj = new MkSGateway(key);
		return obj;
	}

	return {
		GetInstance: function (key) {
			if (!Instance) {
				Instance = CreateInstance(key);
			}

			return Instance;
		}
	};
})();
