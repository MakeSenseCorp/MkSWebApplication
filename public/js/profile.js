$(document).ready(function() {
	var user = localStorage.getItem("user");
	var url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/select/user/" + localStorage.getItem("key") + "/" + localStorage.getItem("userId");

    $.get(url, function(data, status) {
    	$("#txtUsername").val(data.userName);
    	$("#txtPassword").val(data.password);
    	$("#txtKey").val(data.key);
    });

	$("#btnSave").click(function() {
		alert ("Saved");
	});

	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});
});