var SMART_PHONE 		= 2;
var ARDUINO_BASIC 		= 1000;

var OS_ANDROID 			= "android";
var SAMSUNG_GALAXY_S3 	= "SamsungGalaxyS3";

var MakeSenseServerUrl 	= "http://ec2-18-236-253-240.us-west-2.compute.amazonaws.com/";
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