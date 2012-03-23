var API = require("./wantworthy/api").API;

var Wantworthy = module.exports = function (options) {
  options = options || {};
  this.api = new API(options);
  this.started = false; // flag to know if api service has been discovered
};

Wantworthy.prototype.init = function(callback) {
  var self = this;
  this.api.discover(function(err, description){
    if(err) return callback(err);

    self.started = true;
    callback(null);
  });
};