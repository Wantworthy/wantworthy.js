var resourceful = require("../resourceful");

var Store = exports.Store = resourceful.define("store");

Store.stats = function(callback) {
  this._request
    .get(this.url() + "/stats")
    .on('error', callback)
    .set(this.auth())
    .end(this.parseResponse(callback));
};

Store.search = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  this._request
    .get(this.url())
    .send(options)
    .set(this.auth())
    .on('error', callback)
    .end(this.parseResponse(callback));
};