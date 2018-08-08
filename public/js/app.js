function GetApplicationContext(app_id) {
	self = this;
	
	MkSLoadApplicationHtml(app_id, function (html) {
		self.HtmlData = html;
		MkSLoadApplicationJavascript(app_id, function(code) {
			document.getElementById('idApplicationContext').innerHTML += self.HtmlData;
			window['OnApplicationLoaded_' + app_id]();
		});
	});
}

$(document).ready(function() {
	var AppId = MkSGetUrlParameter("app_id");
	GetApplicationContext(AppId);
});