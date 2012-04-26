var resourceful = require("../resourceful");

var Session = exports.Session = resourceful.define("session");

Session.withCredentials = {
  get : true,
  create : true,
  update : true,
  destroy : true
};

Session.prototype.isAdmin = function() {
  if(this.account && this.account.roles) {
    return Boolean(~this.account.roles.indexOf("admin"))
  } else if(this.account) {
    return new RegExp(/@wantworthy.com/).test(this.account.email);
  } else {
    return false;
  }
};

Session.get = function (token, callback) {
  var r = this._request
    .get(this.url())
    .set('Accept', this.schema.mediaType);

  if(token) r.set('Authorization', "token " + token);

  this.acceptCookiesFor(r);
  
  r.end(this.parseResponse(callback));
};