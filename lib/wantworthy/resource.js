var Wantworthy = require("../wantworthy"),
    _ = require("underscore");

var Resource = exports.Resource = function(attrs) {
  var self = this;
};

Resource._request = require('superagent');

Resource.get = function (id, callback) {
  var r = this._request
    .get(this.url() + "/" + id)
    .set('Accept', this.schema.mediaType)
    .set(this.auth());

  if(this.withCredentials['get']){
    Resource.acceptCookiesFor(r);
  }
  
  r.end(this.parseResponse(callback));
};

Resource.create = function (attrs, callback) {
  var r = this._request
    .post(this.url())
    .set('Accept', this.schema.mediaType)
    .set(this.auth());

  if(this.withCredentials['create']){
    Resource.acceptCookiesFor(r);
  }

  r.send(attrs).end(this.parseResponse(callback));
};

Resource.auth = function() {
  if(!Wantworthy.auth) return {};

  return {'Authorization': 'token ' + Wantworthy.auth.get('token') };
}
Resource.acceptCookiesFor = function(request) {
  request.on("xhr:opened", function(xhr) {
    if("withCredentials" in xhr) {
      xhr.withCredentials = true;
    }
  });
};

Resource.new = function (attrs) {
  return new(this)(attrs);
};

Resource.url = function() {
  return this.links.self.href;
};

Resource.withCredentials = {
  get : false,
  create : false,
  update : false,
  destroy : false
};

Resource.parseResponse = function(callback) {
  var self = this;

  return function parser(res) {
    try {
      if(res.ok) {
        if(res.header['content-type'] === 'text/plain') return callback(null);

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

Resource.prototype.get = function(attr) {
  return this.attributes[attr];
};

Resource.prototype.set = function(key, value) {
  var attrs, attr, val;

  // Handle both `"key", value` and `{key: value}` -style arguments.
  if (_.isObject(key) || key == null) {
    attrs = key;
  } else {
    attrs = {};
    attrs[key] = value;
  }

  _.extend(this.attributes, attrs);
};

Resource.prototype.has = function(attr) {
  return this.get(attr) != null;
},

Resource.prototype.url = function() {
  return this.links.self.href;
};

Resource.prototype.toString = function () {
  return JSON.stringify(this.attributes);
};

Resource.prototype.toJSON = function () {
  return _.clone(this.attributes);
};

Resource.prototype.save = function(callback) {
  if(this.isNew()) {
    this.constructor.create(this.toJSON(), callback);
  } else {
    this.update(this.toJSON(), callback);
  }
};

Resource.prototype.update = function(attrs, callback) {
  var r = this.constructor._request
          .put(this.url())
          .type(this.constructor.schema.mediaType)
          .set(Resource.auth());

  if(this.constructor.withCredentials['update']) {
    Resource.acceptCookiesFor(r);
  };

  r.send(attrs).end(this.constructor.parseResponse(callback));
};

Resource.prototype.isNew = function() {
  return !this.links || !this.links.self;
};

// var Want = require("./lib/wantworthy");
// var w = new Want({url: "http://api.dev.wantworthy.com:9000"});
// w.start(console.log);
// w.login({email : "root@wantworthy.com", password: "wworthy789"}, console.log);
// Want.Product.create({name : "foo", url: "http://amazon.com/prod/133"}, console.log);

// Want.Scraper.get("nastygal.com", console.log);
// Want.Account.find({slug : "root-root"}, console.log);