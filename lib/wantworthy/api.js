var request = require('superagent');

var API = exports.API = function(options) {
  options = options || {};

  this.url = options.url || 'https://api.wantworthy.com';
  this.version = options.version || '1.0';
  this.types = {};
};

API.prototype.discover = function(callback) {
  if(this.description) return callback(null, this.description);

  var self = this;

  this.discoverRequest(function (err, description) {
    if(err) return callback(err);

    self.setDescription(description);

    callback(null, description);
  });
};

API.prototype.setDescription = function(description) {
  var self = this;

  this.description = description;
  this.schema = description.schema[this.version];

  Object.keys(this.schema).forEach(function(resource){
    var mediaType = self.schema[resource].mediaType;
    
    self.types[resource] = mediaType;
    request.serialize[mediaType] = JSON.stringify;
  });
};

API.prototype.login = function(auth, callback) {
  request
    .post(this.urlFor('sessions'))
    .type(this.mediaType('account'))
    .set('Accept', this.mediaType('session'))
    .send(auth)
    .end(parseResponse(callback));
};

API.prototype.createAccount = function(accountParams, callback) {
  request
    .post(this.urlFor('accounts'))
    .type(this.mediaType('account'))
    .set('Accept', this.mediaType('session'))
    .send(accountParams)
    .end(parseResponse(callback));
};

API.prototype.getSession = function(token, callback) {
  request
    .get(this.urlFor('sessions') + '/' + token)
    .set('Accept', this.mediaType('session'))
    .end(parseResponse(callback));
};

function parseResponse(callback) {
  return function parser(res) {
    try {
      if(res.ok) {
        return callback(null, JSON.parse(res.text));
      } else{
        return callback(JSON.parse(res.text));
      }      
    } catch(err){
      return callback(err);
    }
  }
};

API.prototype.discoverRequest = function(callback) {
  var self = this;

  request
    .get(self.url + "/")
    .set('Accept', 'application/json')
    .end(function(res) {
      if(!res.ok) return callback(new Error(res.text || "Service Unavailable " + self.url));

      return callback(null, res.body);
    });
};

API.prototype.mediaType = function (resourceName) {
  if (!this.schema) {
    throw "No description object.  Run `wantworthy.api.discover` first.";
  }

  if (!this.schema[resourceName]) {
    throw "No schema for resource " + resourceName;
  }

  return this.schema[resourceName].mediaType;
};

API.prototype.urlFor = function (resourceName) {
  if (!this.description) {
    throw "No description object.  Run `wantworthy.api.discover` first.";
  }

  if (!this.description.resources[resourceName]) {
    throw "No schema for resource " + resourceName;
  }

  return this.description.resources[resourceName].url;
};