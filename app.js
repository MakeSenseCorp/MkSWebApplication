const Gateway 	= require('./gateway.js')();
const Database 	= require('./database.js')();
const Webface 	= require('./webface.js')();

// Params for webface instance
var WebfaceInfo = {
	"RestAPIPort": 8080
};
// Params for gateway instance
var GatewayInfo = {
	"WsPort": 1981,
	"RestAPIPort": 8081
};
// Params for database instance
var DatabaseInfo = {
	"RestAPIPort": 8082
};

// Create database instance
var database = new Database(DatabaseInfo);
// Create gateway instance
var gateway = new Gateway(GatewayInfo);
// Create webface instance
var webface = new Webface(WebfaceInfo);

// Set webface with database instance (object base sharing)
webface.SetDatabaseInstance(database);
// Set webface with gateway instance
webface.SetGatewayInstance(gateway);
// Set gateway with database instance (object base sharing)
gateway.SetDatabaseInstance(database);
// Start gateway
gateway.Start();
