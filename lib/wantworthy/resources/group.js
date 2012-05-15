var resourceful = require("../resourceful"),
    _ = require("underscore");

var Group = exports.Group = resourceful.define("group");

Group.list = function(accountID, callback) {
  this._request
    .get(this.url() + "/" + accountID)
    .on('error', callback)
    // .set('Accept', this.schema.mediaType)
    .end(this.parseResponse(callback));
};

Group.prototype.rename = function(name, callback) {
  this.set({"name" : name});

  this.constructor._request
    .post(this.url())
    .set(this.auth())
    .on('error', callback)
    .send({name : name})
    .end(this.constructor.parseResponse(callback));
};

Group.prototype.addProduct = function(productID, callback) {
  var productIds = this.get("productIds") || [];
  productIds.push(productID);

  this.set("productIds", productIds);

  this.constructor._request
    .put(this.url())
    .set(this.auth())
    .on('error', callback)
    .send({productID : productID})
    .end(this.constructor.parseResponse(callback));
};

Group.prototype.removeProduct = function(productID, callback) {
  var productIds = this.get("productIds") || [];
  productIds = _.without(productIds, productID);
  
  this.set("productIds", productIds);

  this.constructor._request
    .del(this.url() + "/" + productID)
    .set(this.auth())
    .on('error', callback)
    .send({productID : productID})
    .end(this.constructor.parseResponse(callback));
};