var resourceful = require("../resourceful");

var Account = exports.Account = resourceful.define("account");

Account.withCredentials.create = true;

Account.find = function (params, callback) {
  this._request
    .get(this.url())
    .send(params)
    .set('Accept', this.schema.mediaType)
    .set(this.auth())
    .on('error', callback)
    .end(this.parseResponse(callback));
};

Account.initPasswordReset = function (email, callback) {
  this._request
    .post(this.url() + '/pwforgot')
    .send({ email: email })
    .set('Accept', this.schema.mediaType)
    .on('error', callback)
    .end(this.parseResponse(callback));
};

Account.resetPassword = function (resetParams, callback) {
  this._request
    .post(this.url() + '/pwreset')
    .send(resetParams)
    .set('Accept', this.schema.mediaType)
    .on('error', callback)
    .end(this.parseResponse(callback));
};

Account.prototype.getFullName = function () {
  var first = this.get('first_name') || '';
  var last = this.get('last_name') || '';
  if (!first && !last) {
    return this.get('slug');
  }
  return first + ((first || last) ? ' ' : '') + last;
}

Account.prototype.getShortName = function () {
  return this.get('first_name') || this.get('slug');
}

Account.prototype.productGroups = function (callback) {
  if(!this.links || !this.links.productGroups) return callback();

  this.constructor._request
    .get(this.links.productGroups.href)
    .on('error', callback)
    .end(this.constructor.parseResponse(callback));
};