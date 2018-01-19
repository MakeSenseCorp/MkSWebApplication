
var uuid = localStorage.getItem("key");
if (uuid == null) {
	window.location.href = "pages/login.html"
} else {
	window.location.href = "pages/dashboard.html"
}
