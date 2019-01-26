
$(document).ready(function() {
	if (MkSGlobal.CheckUserLocalStorage()) {
		window.location.href = "dashboard.html"
	}
	
	$("#login").click(function() {	
		var user = $('#username').val();
		var pwd	 = $('#password').val();
		
		var api = MkSAPIBuilder.GetInstance();
		var webface = MkSWebfaceBuilder.GetInstance();
		webface.Login(user, pwd, function(response) {
			if ("none" == response.error) {				
				MkSGlobal.StoryUserKeyLocalStorage(response.data.key, response.data.id);
				api.SetUserKey(response.data.key);
				// Redirect to dashboard.
				window.location.href = "../index.html";
			} else {
				alert("Incorrect authentication");
			}
		});
	});
});
