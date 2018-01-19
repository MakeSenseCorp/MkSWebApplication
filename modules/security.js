function Security (dbInstance) {
	this.db 		= dbInstance;
	this.adminKey 	= "ux0xhwyqocp";
}

Security.prototype.CheckUUID = function(key, callback) {
	var sql = this.db;
	sql.CheckUserKey(key, function(valid) {
		callback (valid);
	});
}

Security.prototype.CheckAdmin = function(key, callback) {
	if (key == this.adminKey) {
		callback (1);
	} else {
		callback (0);
	}
}

function SecurityFactory() {
    return Security;
}

module.exports = SecurityFactory;
