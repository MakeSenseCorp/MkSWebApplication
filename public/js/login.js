
$(document).ready(function(){
	$("#login").click(function() {		
		var RequestData = {
			request: "login",
			data: {
				user: $('#username').val(),
				pwd:  $('#password').val()
			}
		};
		
		$.ajax({
			url: MakeSenseServerUrl + "api/login/",
			type: "POST",
			dataType: "json",
			data: RequestData,
			async: true,
			success: function (data) {
				console.log(data);
				// localStorage.setItem("key", data.key);
				// localStorage.setItem("userId", data.id);
				// window.location.href = "../index.html";				
			}
		});
	});
});
