var API = require("./wantworthy/api").API;

var Wantworthy = module.exports = function (options) {
  options = options || {};
  this.api = new API(options);
  this.started = false; // flag to know if api service has been discovered
};

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

  this.api.discover(function(err, description){
    if(err) return callback(err);

    if(sessionToken) {
      self.setSession(sessionToken, callback);
    } else {
      return callback(null);
    }
  });
};

Wantworthy.prototype.setSession = function(token, callback) {
  var self = this;

  self.api.getSession(token, function(err, session){
    if(err) return callback(err);
    self.session = session;

    return callback(null, session);
  });
};