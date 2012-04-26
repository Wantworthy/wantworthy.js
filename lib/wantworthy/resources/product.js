var resourceful = require("../resourceful");

var Product = exports.Product = resourceful.define("product");

Product.search = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  this._request
    .get(this.url())
    .send(options)
    // .set('Accept', this.schema.mediaType)
    .end(this.parseResponse(callback));
};