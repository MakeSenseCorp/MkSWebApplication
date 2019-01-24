var MakeSenseServerUrl 	= "http://ec2-18-236-253-240.us-west-2.compute.amazonaws.com:8080/";
var MakeSenseDomain 	= "ec2-18-236-253-240.us-west-2.compute.amazonaws.com";
var UserDEVKey 			= localStorage.getItem("key");

function LogoutHandler() {
	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});
}

function GetServerUrl() {
	return MakeSenseServerUrl;
}

function GetUserKey() {
	return UserDEVKey;
}

function MkSGetUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};