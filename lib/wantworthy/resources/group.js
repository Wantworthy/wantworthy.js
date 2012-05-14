var resourceful = require("../resourceful");

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