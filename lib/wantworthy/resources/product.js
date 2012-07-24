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

Product.find = function (params, callback) {
  this._request
    .get(this.url() + '/' + params.id)
    .send(params)
    .set('Accept', this.schema.mediaType)
    .on('error', callback)
    .end(this.parseResponse(callback));
};
