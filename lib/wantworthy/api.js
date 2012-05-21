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

function parseResponse(callback) {
  return function parser(res) {
    var error;
    try {
      if(res.ok) {
        return callback(null, JSON.parse(res.text));
      } else if(res.unauthorized){
        error = new Error(res.text);
        error.statusCode = res.status;
        return callback(error);
      } else if(res.header['content-type'] === 'text/plain'){
        error = new Error(res.text)
        error.statusCode = res.status;
        return callback(error);
      } else {
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

      return callback(null, JSON.parse(res.text));
    });
};