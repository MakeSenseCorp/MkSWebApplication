
$(document).ready(function(){
  $("#btnSignup").click(function() {
    var username = $('#txtUsername').val();
    var password = $('#txtPassword').val();
    var passwordSec = $('#txtPasswordSec').val();

    if (password == passwordSec) {
      var url = "http://ec2-18-236-253-240.us-west-2.compute.amazonaws.com:8080/insert/user/ux0xhwyqocp/" + username + "/" + password;

      $.get(url, function(data, status) {
        alert (data);
        window.location.href = "../index.html";
      });
    } else {
      alert ("Password incorrect");
    }
  });
});
