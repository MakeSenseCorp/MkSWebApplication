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
	
	// Callbacks
	this.OnGatewayDataArrived 				= null;
	this.OnGetNodeInfoCallback 				= null;
	this.OnNodeInfoChangeCallback 			= null;
	this.OnNodeSensorInfoChangeCallback 	= null;
	this.OnGatewayConnectedCallback			= null;
	
	this.Connect();
	return this;
}

MkSGateway.prototype.WSWatchdog = function () {
	
}

MkSGateway.prototype.Connect = function (callback) {
	var self = this;
	
	if ("DISCONN" == this.WSState) {
		this.WS = new WebSocket(this.WSServerFullURl, ['echo-protocol']);
		this.WS.onopen = function () {
			var handshakeMsg = {
				msg_type: 'HANDSHAKE',
				key: self.Key
			};
			console.log('Connected to Gateway ... Sending handshake ...', handshakeMsg);
			self.WS.send(JSON.stringify(handshakeMsg));
			this.WSState = "CONN";
			
			if (null != self.OnGatewayConnectedCallback) {
				console.log("Callback");
				self.OnGatewayConnectedCallback();
			}
		};
		
		this.WS.onmessage = function (event) {
			console.log(event.data);
			callback(event.data);
		}
		
		this.WS.onclose = function () {
			console.log("Connection closed...");
			this.WSState = "DISCONN";
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
		msg_type: type,
		destination: dest_uuid,
		source: "WEBFACE",
		data: {
			device: {
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