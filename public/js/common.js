var SMART_PHONE 		= 2;
var ARDUINO_BASIC 		= 1000;

var OS_ANDROID 			= "android";
var SAMSUNG_GALAXY_S3 	= "SamsungGalaxyS3";

var MakeSenseServerUrl 	= "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/";
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