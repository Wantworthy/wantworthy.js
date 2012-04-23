var resourceful = require("../resourceful");

var Session = exports.Session = resourceful.define("session");

// var Session = exports.Session = function(sessionData){
//   this.name = 'session';
//   this.data = sessionData;
//   this.token = sessionData.token;

//   this.resources = this.data.resources;
//   this.account = this.resources.account;
// };

Session.prototype.account = function() {
  return this._attributes.resources.account;
};

Session.prototype.isAdmin = function() {
  if(this.account() && this.account().roles){
    return Boolean(~this.account().roles.indexOf("admin"))
  } else if(this.account()) {
    return new RegExp(/@wantworthy.com/).test(this.account().email);
  } else {
    return false;
  }
};