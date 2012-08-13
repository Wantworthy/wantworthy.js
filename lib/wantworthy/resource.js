var Wantworthy = require("../wantworthy"),
    resourceful = require("./resourceful"),
    _ = require("underscore");

var Resource = exports.Resource = function(attrs) {
  var self = this;
  self.links = {};
  self.attributes = {};

  if(attrs && attrs._embedded) {
    Object.keys(attrs._embedded).forEach(function(resourceName){
      if(_.isArray(attrs._embedded[resourceName])) {
        self[resourceName]  =  _.map(attrs._embedded[resourceName], function(r) {
          if(resourceful.resources[resourceName]) {
            return new(resourceful.resources[resourceName])(r);
          } else {
            return new Resource(r);
          }
        });
      } else {
        if(resourceful.resources[resourceName]) {
          self[resourceName] = new(resourceful.resources[resourceName])(attrs._embedded[resourceName]);
        } else {
          self[resourceName] = new Resource(attrs._embedded[resourceName]);
        }
      }
    });

    delete attrs._embedded;
  }

  if(attrs && attrs._links) {
    self.links = attrs._links;
    delete attrs._links;
  }
  
  if(attrs) self.attributes = attrs;

  if(this.initialize) {
    this.initialize.call(this, arguments);
  }
};

Resource._request = require('superagent');

Resource.get = function (id, callback) {
  if (id instanceof Array) {
    id = id.join(',');
  }
  var r = this._request
    .get(this.url() + "/" + id)
    .set('Accept', this.schema.mediaType)
    .set(this.auth())
    .on('error', callback);

  if(this.withCredentials.get) {
    Resource.acceptCookiesFor(r);
  }
  
  r.end(this.parseResponse(callback));
};

Resource.create = function (attrs, callback) {
  var r = this._request
    .post(this.url())
    .set('Accept', this.schema.mediaType)
    .set(this.auth())
    .on('error', callback);

  if(this.withCredentials.create){
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

Resource.init = function (attrs) {
  return new(this)(attrs);
};

Resource.url = function(rel, tokens) {
  rel = rel || 'self';
  tokens = tokens || {};

  var url = this.links[rel].href;

  //If tokens has any keys, try to replace them in the URL
  if (Object.keys(tokens).length) {
    url = url.replace(/\:(\w+)\:/g, function (match, token) {
      return tokens.hasOwnProperty(token) ? tokens[token] : match;
    });
  }

  return url;
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
    var p = function(x) { return x; };
    
    var contentType = res.header['content-type'];
    if(!contentType && res.xhr) contentType =  res.xhr.getResponseHeader('Content-Type');

    if(contentType) {
      var content = contentType.split(";")[0].split(/\+|\//);

      if(content && ~content.indexOf('json')){
        p = JSON.parse;
      }
    }

    if(res.ok) {
      if(contentType === 'text/plain') return callback(null, p(res.text));
      var resourceFactory = self;
      Object.keys(Wantworthy.resourceful.resources).forEach(function (resourceName) {
        var possibleResource = Wantworthy.resourceful.resources[resourceName];
        if (contentType === possibleResource.schema.mediaType) {
          resourceFactory = possibleResource;
        }
      });
      return callback(null, resourceFactory.init(p(res.text) ));
    } else {
      var message = "client error";
      if(res.serverError) message = "server error";
      
      var error = new Error(message);
      error.body = p(res.text)
      error.statusCode = res.status;
      return callback(error);
    }
  }
};

Resource.prototype.get = function(attr) {
  return this.attributes[attr];
};

Resource.prototype.set = function(key, value) {
  var attrs, attr, val;

  // Handle both `"key", value` and `{key: value}` -style arguments.
  if (_.isObject(key) || key === null) {
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

Resource.prototype.url = function(rel, tokens) {
  rel = rel || 'self';
  tokens = tokens || {};

  var url = this.links[rel].href;

  //If tokens has any keys, try to replace them in the URL
  if (Object.keys(tokens).length) {
    url = url.replace(/\:(\w+)\:/g, function (match, token) {
      return tokens.hasOwnProperty(token) ? tokens[token] : match;
    });
  }

  return url;
};

Resource.prototype.auth = function() {
  return this.constructor.auth();
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

Resource.prototype.destroy = function(callback) {
  if(this.isNew()) {
    return callback(); // nothing to delete on the server
  } else {
    var r = this.constructor._request
            .del(this.url())
            .set(Resource.auth())
            .on('error', callback);

    if(this.constructor.withCredentials.update) {
      Resource.acceptCookiesFor(r);
    }

    r.end(this.constructor.parseResponse(callback));
  }
};

Resource.prototype.update = function(attrs, callback) {
  var r = this.constructor._request
          .put(this.url())
          .type(this.constructor.schema.mediaType)
          .set(Resource.auth())
          .on('error', callback);

  if(this.constructor.withCredentials.update) {
    Resource.acceptCookiesFor(r);
  }

  r.send(attrs).end(this.constructor.parseResponse(callback));
};

Resource.prototype.isNew = function() {
  return !this.links || !this.links.self;
};

//Gets the resource information for a given key
// Returns { url: [url], requiresAuth: [true|false] }
Resource.prototype.getResourceDetails = function(id, callback) {
  //Start with 'links' as the current node
  var currentNode = this.links;
  //For depth > 1, we need to split keys up with a '.'
  var keys = id.split('.');
  //Loop through the keys parts
  while (keys.length) {
    //Take the first key part off the list and see if currentNode has that property
    var key = keys.shift();
    currentNode = currentNode[key];
    if (!currentNode) {
      return callback({ type: 'missing_key', id: id, key: key });
    }
  }

  var resourceUrl;
  var requiresAuth = false;
  if (currentNode.href) { //If the property has an href, use it
    resourceUrl = currentNode.href;
    //Setting the attribute 'requiresAuth' to 'true' cause credentials to be sent with the resource request
    requiresAuth = currentNode.requiresAuth === 'true';
  } else if (typeof currentNode === 'string') { //If the property is a string, treat it as the href
    resourceUrl = currentNode;
  } else {
    return callback({ type: 'missing_url', id: id });
  }

  callback(null, { url: resourceUrl, requiresAuth: requiresAuth });
};

//Fetches external resources referred to by the "links" property
Resource.prototype.fetch = function(id, callback) {
  var self = this;

  self.getResourceDetails(id, function (err, resource) {
    if (err) {
      return callback(err);
    }

    //Build the request
    var request = self.constructor._request
      .get(resource.url)
      .on('error', callback)
      ;

    if (resource.requiresAuth) {
      request.set(Resource.auth());
    }

    request.send().end(self.constructor.parseResponse(callback));
  });
};

// var Want = require("./lib/wantworthy");
// var w = new Want({url: "http://api.dev.wantworthy.com:9000"});
// w.start(console.log);
// w.login({email : "ryan@wantworthy.com", password: "test123"}, console.log);
// Want.Product.get("2403920b-3575-40d2-afb3-002225821bdd", function(err, p){product = p;});
// product.comments(function(err, c){comments = c;});
// Want.Product.create({name : "foo", url: "http://amazon.com/prod/133"}, console.log);

// Want.Scraper.get("nastygal.com", console.log);
// Want.Account.find({slug : "root-root"}, console.log);