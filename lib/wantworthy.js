var API = require("./wantworthy/api").API;
    // Session = require('./wantworthy/resources/session').Session;

var Wantworthy = module.exports = function (options) {
  options = options || {};
  this.api = new API(options);
  this.started = false; // flag to know if api service has been discovered
};

Wantworthy.resourceful = require("./wantworthy/resourceful");

Wantworthy.Store = Wantworthy.resourceful.define("store");
Wantworthy.Scraper = Wantworthy.resourceful.define("scraper");
Wantworthy.Account = Wantworthy.resourceful.define("account");
Wantworthy.Session = require('./wantworthy/resources/session').Session;
Wantworthy.Product = Wantworthy.resourceful.define("product");

//
// ### function start (sessionToken, done)
// #### @sessionToken {string} optional session token, if previous session exists.
// #### @callback {function} Continuation to respond to when the client has been started, 
// Initializes the wantworthy client with api description and optionally an existing session
//
Wantworthy.prototype.start = function(sessionToken, callback) {
  if (!callback && typeof sessionToken === 'function') {
      callback = sessionToken;
      sessionToken = null;
  }

  var self = this;

  this.api.discover(function(err, description) {
    if(err) return callback(err);

    Wantworthy.resourceful.setDescription(description);

    return self.loadSession(sessionToken, callback);
  });
};

Wantworthy.prototype.register = function(accountParams, callback) {
  var self = this;

  self.api.createAccount(accountParams, function(err, sessionData){
    if(err) return callback(err);

    self.session = new Session(sessionData);
    return callback(null, self.session);
  });
};

Wantworthy.prototype.login = function(credentials, callback) {
  var self = this;

  Wantworthy.Session.create(credentials, function(err, session){
    if(err) return callback(err);

    self.session = session;
    return callback(null, self.session);
  });
};

Wantworthy.prototype.loadSession = function(token, callback) {
  var self = this;

  Wantworthy.Session.get(token, function(err, session) {
    if(err && err.statusCode != 401) return callback(err);

    self.session = session;
    return callback(null, session);
  });
};