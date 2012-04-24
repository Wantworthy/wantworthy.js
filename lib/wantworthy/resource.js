var Wantworthy = require("../wantworthy");

var Resource = exports.Resource = function(attrs) {
  var self = this;

  this._attributes = attrs;

  if(this._attributes) {
    Object.keys(attrs).forEach(function(key){
      self[key] = attrs[key];
    });
  }
};

Resource._request = require('superagent');

Resource.get = function (id, callback) {
  var r = this._request
    .get(this.url() + "/" + id)
    .set('Accept', this.schema.mediaType);

  if(Wantworthy.auth) r.set('Authorization', "token " + Wantworthy.auth.token)
  
  r.end(this.parseResponse(callback));
};

Resource.create = function (attrs, callback) {
  var r = this._request
    .post(this.url())
    .set('Accept', this.schema.mediaType);

  if(Wantworthy.auth) r.set('Authorization', "token " + Wantworthy.auth.token)

  r.send(attrs).end(this.parseResponse(callback));
};

Resource.new = function (attrs) {
  return new(this)(attrs);
};

Resource.url = function() {
  return this.links.self.href;
};

Resource.parseResponse = function(callback) {
  var self = this;

  return function parser(res) {
    try {
      if(res.ok) {
        return callback(null, self.new(JSON.parse(res.text) ));
      } else if(res.unauthorized) {
        var error = new Error(res.text);
        error.statusCode = res.status;
        return callback(error);
      } else if(res.header['content-type'] === 'text/plain'){
        var error = new Error(res.text)
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

Resource.prototype.toString = function () {
  return JSON.stringify(this._attributes);
};

// var Want = require("./lib/wantworthy");
// var w = new Want({url: "http://api.dev.wantworthy.com:9000"});
// w.start(console.log);
// w.login({email : "test@test.com", password: "test123"}, console.log);
// Want.Product.create({name : "foo", url: "http://amazon.com/prod/133"}, console.log);