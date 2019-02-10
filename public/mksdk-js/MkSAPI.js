function MkSAPI (key) {
	self = this;
	
	this.Key		= key;
	this.Gateway 	= null;
	this.Webface 	= MkSWebfaceBuilder.GetInstance();
	this.Database 	= null;
	
	return this;
}

MkSAPI.prototype.SetUserKey = function (key) {
	this.Key = key;
}

MkSAPI.prototype.ConnectGateway = function () {
	this.Gateway = MkSGatewayBuilder.GetInstance(this.Key);
}

MkSAPI.prototype.GetNodeInfo = function (uuid) {
	this.Gateway.Send("DIRECT", uuid, "get_node_info", "", "");
}

MkSAPI.prototype.GetNodeSensorsInfo = function (uuid) {
	this.Gateway.Send("DIRECT", uuid, "get_sensor_info", "", "");
}

MkSAPI.prototype.SetNodeSensorsInfo = function (uuid, sensors) {
	this.Gateway.Send("DIRECT", uuid, "set_sensor_info", sensors, "");
}

MkSAPI.prototype.GetFileContent = function (uuid, payload) {
	this.Gateway.Send("DIRECT", uuid, "get_file", payload, "");
}


var MkSAPIBuilder = (function () {
	var Instance;

	function CreateInstance () {
		if (MkSGlobal.CheckUserLocalStorage) {
			return new MkSAPI(MkSGlobal.UserDEVKey);
		} else {
			return null;
		}
	}

	return {
		GetInstance: function () {
			if (!Instance) {
				console.log("Create API instance");
				Instance = CreateInstance();
			}

			console.log("Return API instance");
			return Instance;
		}
	};
})();
