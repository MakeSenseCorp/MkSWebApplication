
$(document).ready(function(){
	$("#login").click(function() {
		var username = $('#username').val();
		var password = $('#password').val();
		var url = "http://ec2-18-236-253-240.us-west-2.compute.amazonaws.com/login/" + username + "/" + password;

		$.get(url, function(data, status) {
			if (data.error != null) {

			} else {
				localStorage.setItem("key", data.key);
				localStorage.setItem("userId", data.id);
				window.location.href = "../index.html";
			}
		});
	});
});
