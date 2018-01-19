
$(document).ready(function(){
  $("#btnSignup").click(function() {
    var username = $('#txtUsername').val();
    var password = $('#txtPassword').val();
    var passwordSec = $('#txtPasswordSec').val();

    if (password == passwordSec) {
      var url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/insert/user/ux0xhwyqocp/" + username + "/" + password;

      $.get(url, function(data, status) {
        alert (data);
        window.location.href = "../index.html";
      });
    } else {
      alert ("Password incorrect");
    }
  });
});
