var resourceful = require("../resourceful");

var Account = exports.Account = resourceful.define("account");

Account.withCredentials["create"] = true;