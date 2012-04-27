var resourceful = require("../resourceful");

var Account = exports.Account = resourceful.define("account");

Account.withCredentials["create"] = true;

Account.find = function (params, callback) {
  this._request
    .get(this.url())
    .send(params)
    .set('Accept', this.schema.mediaType)
    .set(this.auth())
    .end(this.parseResponse(callback));
};