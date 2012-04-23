var resourceful = require("../resourceful");

var Session = exports.Session = resourceful.define("session");

Session.prototype.isAdmin = function() {
  if(this.account && this.account.roles) {
    return Boolean(~this.account.roles.indexOf("admin"))
  } else if(this.account) {
    return new RegExp(/@wantworthy.com/).test(this.account.email);
  } else {
    return false;
  }
};