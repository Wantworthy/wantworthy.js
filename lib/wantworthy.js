(function() {
  var root = this;

  var Wantworthy;
  if (typeof exports !== 'undefined') {
    Wantworthy = exports;
    Wantworthy.request = require('superagent');
  } else {
    Wantworthy = root.Wantworthy = {};
    Wantworthy.request = window.superagent;
  }

  Wantworthy.createClient = function(options, callback){
    var client = new Client(options);
    client.init(function(err) {
      if(err) return callback(err);

      return callback(null, client);
    });
  };

  var Client = Wantworthy.Client = function(options) {
    options = options || {};
    this.api = new API(options);
    this.started = false; // flag to know if api service has been discovered
  };

  Client.prototype.init = function(callback) {
    var self = this;
    this.api.discover(function(err, description){
      if(err) return callback(err);

      self.started = true;
      callback(null);
    });
  };

  var API = Wantworthy.API = function(options) {
    options = options || {};

    this.url = options.url || 'https://api.wantworthy.com';
    this.version = options.version || '1.0';
    this.request = Wantworthy.request;
  };

  API.prototype.discover = function(callback) {
    if(this.description) return callback(null, this.description);

    var self = this;

    this.discoverRequest(function (err, description) {
      if(err) return callback(err);

      self.description = description;
      self.schema = description.schema[self.version];

      callback(null, description);
    });
  };

  API.prototype.discoverRequest = function(callback) {
    var self = this;

    this.request
      .get(self.url + "/")
      .set('Accept', 'application/json')
      .end(function(res) {
        if(!res.ok) return callback(new Error(res.text));

        return callback(null, res.body);
      });
  };

}).call(this);