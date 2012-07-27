var resourceful = require("../resourceful");

var Product = exports.Product = resourceful.define("product");

Product.search = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  //TODO: fix the 'Accept' for product sets
  this._request
    .get(this.url())
    .send(options)
    .on('error', callback)
    // .set('Accept', this.schema.mediaType)
    .end(this.parseResponse(callback));
};

Product.prototype.comments = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  this.constructor._request
    .get(this.url("comments"))
    .send(options)
    .set(this.auth())
    .on('error', callback)
    .end(this.constructor.parseResponse(callback));
};
