function DeviceSwitch (device, callback) {
	self = this;
	self.Device = device;
	self.DeviceFileName = device.type + "-device";
	
	MkSLoadModuleHtml(self.DeviceFileName + "/" + self.DeviceFileName, function(data) {
		htmlData = data;
		console.log(self.Device);
		
		/*
		Replace TAGs with real data.
		*/
		htmlData = htmlData.split("[DEVICE_UUID]").join(self.Device.uuid);
		htmlData = htmlData.split("[DEVICE_NAME]").join(device.name);
		htmlData = htmlData.split("[DEVICE_DESCRIPTION]").join(device.description);
		htmlData = htmlData.replace("[DEVICE_ICON]", "modules/" + self.DeviceFileName + "/" + self.DeviceFileName + ".png");
		
		switch (self.Device.type) {
			case SMART_PHONE:
				if (self.Device.osType == OS_ANDROID) {
					if (self.Device.brandName == SAMSUNG_GALAXY_S3) {
					}
				}
			break;
			case ARDUINO_BASIC:
			break;
			default:
			break;
		}
		
		self.HtmlData = htmlData;
		MkSLoadModuleJavascript(self.DeviceFileName + "/" + self.DeviceFileName, function(data) {
			callback(self.HtmlData);
		});
	});
}