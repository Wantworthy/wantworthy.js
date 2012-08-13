!function (root, definition) {
  if (typeof define == 'function' && typeof define.amd  == 'object') define('wantworthy', definition);
  else root.Wantworthy = definition();
}(this, function () {

// CommonJS require()

function requireSync(p){
    var path = requireSync.resolve(p)
      , mod = requireSync.modules[path];
    if (!mod) throw new Error('failed to require "' + p + '"');
    if (!mod.exports) {
      mod.exports = {};
      mod.call(mod.exports, mod, mod.exports, requireSync.relative(path));
    }
    return mod.exports;
  }

requireSync.modules = {};

requireSync.resolve = function (path){
    var orig = path
      , reg = path + '.js'
      , index = path + '/index.js';
    return requireSync.modules[reg] && reg
      || requireSync.modules[index] && index
      || orig;
  };

requireSync.register = function (path, fn){
    requireSync.modules[path] = fn;
  };

requireSync.relative = function (parent) {
    return function(p){
      if ('.' != p[0]) return requireSync(p);

      var path = parent.split('/')
        , segs = p.split('/');
      path.pop();

      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if ('..' == seg) path.pop();
        else if ('.' != seg) path.push(seg);
      }

      return requireSync(path.join('/'));
    };
  };


requireSync.register("wantworthy.js", function(module, exports, require){
var API = require("./wantworthy/api").API;
    // Session = require('./wantworthy/resources/session').Session;

var Wantworthy = module.exports = function (options) {
  this.options = options || {};
  this.api = new API(options);
  this.started = false; // flag to know if api service has been discovered
};

Wantworthy.resourceful = require("./wantworthy/resourceful");

Wantworthy.Store = require('./wantworthy/resources/store').Store;
Wantworthy.Scraper = require('./wantworthy/resources/scraper').Scraper;
Wantworthy.Account = require('./wantworthy/resources/account').Account;
Wantworthy.Session = require('./wantworthy/resources/session').Session;
Wantworthy.Product = require('./wantworthy/resources/product').Product;
Wantworthy.Group = require('./wantworthy/resources/group').Group;
Wantworthy.Comment = require('./wantworthy/resources/comment').Comment;

//
// ### function start (sessionToken, done)
// #### @sessionToken {string} optional session token, if previous session exists.
// #### @callback {function} Continuation to respond to when the client has been started, 
// Initializes the wantworthy client with api description and optionally an existing session
//
Wantworthy.prototype.start = function(sessionToken, callback) {
  if (!callback && typeof sessionToken === 'function') {
      callback = sessionToken;
      sessionToken = null;
  }

  if(!callback) callback = function(){};

  var self = this;

  this.api.discover(function(err, description) {
    if(err) return callback(err);

    Wantworthy.resourceful.setDescription(description);

    return self.loadSession(sessionToken, callback);
  });
};

Wantworthy.prototype.register = function(accountParams, callback) {
  var self = this;

  Wantworthy.Account.create(accountParams, function(err, account){
    if(err) return callback(err);

    return self.login({secret : account.get("secret")}, callback);
  });
};

Wantworthy.prototype.initPasswordReset = function(email, callback) {
  Wantworthy.Account.initPasswordReset(email, callback);
};

Wantworthy.prototype.resetPassword = function(resetParams, callback) {
  Wantworthy.Account.resetPassword(resetParams, callback);
};

Wantworthy.prototype.login = function(credentials, callback) {
  var self = this;

  Wantworthy.Session.create(credentials, function(err, session){
    if(err) return callback(err);

    self.session = session;
    Wantworthy.auth = self.session;

    return callback(null, self.session);
  });
};

Wantworthy.prototype.loadSession = function(token, callback) {
  if (!callback && typeof token === 'function') {
    callback = token;
    token = null;
  }

  var self = this;

  Wantworthy.Session.get(token, function(err, session) {
    if(err && err.statusCode != 401) return callback(err);

    self.session = session;
    Wantworthy.auth = self.session;

    return callback(null, session);
  });
};

}); // module: wantworthy.js

requireSync.register("wantworthy/api.js", function(module, exports, require){
var request = require('wantworthy/browser/superagent');

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
}); // module: wantworthy/api.js

requireSync.register("wantworthy/browser/superagent.js", function(module, exports, require){

/**
 * Module exports.
 */

/**
 * Check if `obj` is an array.
 */

function isArray(obj) {
  return '[object Array]' == {}.toString.call(obj);
}

/**
 * Event emitter constructor.
 *
 * @api public.
 */

function EventEmitter(){};

/**
 * Adds a listener.
 *
 * @api public
 */

EventEmitter.prototype.on = function (name, fn) {
  if (!this.$events) {
    this.$events = {};
  }

  if (!this.$events[name]) {
    this.$events[name] = fn;
  } else if (isArray(this.$events[name])) {
    this.$events[name].push(fn);
  } else {
    this.$events[name] = [this.$events[name], fn];
  }

  return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

/**
 * Adds a volatile listener.
 *
 * @api public
 */

EventEmitter.prototype.once = function (name, fn) {
  var self = this;

  function on () {
    self.removeListener(name, on);
    fn.apply(this, arguments);
  };

  on.listener = fn;
  this.on(name, on);

  return this;
};

/**
 * Removes a listener.
 *
 * @api public
 */

EventEmitter.prototype.removeListener = function (name, fn) {
  if (this.$events && this.$events[name]) {
    var list = this.$events[name];

    if (isArray(list)) {
      var pos = -1;

      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
          pos = i;
          break;
        }
      }

      if (pos < 0) {
        return this;
      }

      list.splice(pos, 1);

      if (!list.length) {
        delete this.$events[name];
      }
    } else if (list === fn || (list.listener && list.listener === fn)) {
      delete this.$events[name];
    }
  }

  return this;
};

/**
 * Removes all listeners for an event.
 *
 * @api public
 */

EventEmitter.prototype.removeAllListeners = function (name) {
  if (name === undefined) {
    this.$events = {};
    return this;
  }

  if (this.$events && this.$events[name]) {
    this.$events[name] = null;
  }

  return this;
};

/**
 * Gets all listeners for a certain event.
 *
 * @api publci
 */

EventEmitter.prototype.listeners = function (name) {
  if (!this.$events) {
    this.$events = {};
  }

  if (!this.$events[name]) {
    this.$events[name] = [];
  }

  if (!isArray(this.$events[name])) {
    this.$events[name] = [this.$events[name]];
  }

  return this.$events[name];
};

/**
 * Emits an event.
 *
 * @api public
 */

EventEmitter.prototype.emit = function (name) {
  if (!this.$events) {
    return false;
  }

  var handler = this.$events[name];

  if (!handler) {
    return false;
  }

  var args = [].slice.call(arguments, 1);

  if ('function' == typeof handler) {
    handler.apply(this, args);
  } else if (isArray(handler)) {
    var listeners = handler.slice();

    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
  } else {
    return false;
  }

  return true;
};
/*!
 * superagent
 * Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var superagent = function(exports){
  
  /**
   * Expose the request function.
   */
  
  exports = request;

  /**
   * Library version.
   */

  exports.version = '0.3.0';

  /**
   * Noop.
   */

  var noop = function(){};

  /**
   * Determine XHR.
   */

  function getXHR() {
    if (window.XMLHttpRequest
      && ('file:' != window.location.protocol || !window.ActiveXObject)) {
      return new XMLHttpRequest;
    } else {
      try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
    }
    return false;
  }

  /**
   * Removes leading and trailing whitespace, added to support IE.
   *
   * @param {String} s
   * @return {String}
   * @api private
   */

  var trim = ''.trim
    ? function(s) { return s.trim(); }
    : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

 /**
  * Check if `obj` is a function.
  *
  * @param {Mixed} obj
  * @return {Boolean}
  * @api private
  */
  
  function isFunction(obj) {
    return 'function' == typeof obj;
  }

  /**
   * Check if `obj` is an object.
   *
   * @param {Object} obj
   * @return {Boolean}
   * @api private
   */

  function isObject(obj) {
    return null != obj && 'object' == typeof obj;
  }

  /**
   * Serialize the given `obj`.
   *
   * @param {Object} obj
   * @return {String}
   * @api private
   */

  function serialize(obj) {
    if (!isObject(obj)) return obj;
    var pairs = [];
    for (var key in obj) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
    return pairs.join('&');
  }

  /**
   * Expose serialization method.
   */

   exports.serializeObject = serialize;

   /**
    * Parse the given x-www-form-urlencoded `str`.
    *
    * @param {String} str
    * @return {Object}
    * @api private
    */

  function parseString(str) {
    var obj = {}
      , pairs = str.split('&')
      , parts
      , pair;

    for (var i = 0, len = pairs.length; i < len; ++i) {
      pair = pairs[i];
      parts = pair.split('=');
      obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }

    return obj;
  }

  /**
   * Expose parser.
   */

  exports.parseString = parseString;

  /**
   * Default MIME type map.
   * 
   *     superagent.types.xml = 'application/xml';
   * 
   */

  exports.types = {
      html: 'text/html'
    , json: 'application/json'
    , urlencoded: 'application/x-www-form-urlencoded'
    , 'form-data': 'application/x-www-form-urlencoded'
  };

  /**
   * Default serialization map.
   * 
   *     superagent.serialize['application/xml'] = function(obj){
   *       return 'generated xml here';
   *     };
   * 
   */

   exports.serialize = {
       'application/x-www-form-urlencoded': serialize
     , 'application/json': JSON.stringify
   };

   /**
    * Default parsers.
    * 
    *     superagent.parse['application/xml'] = function(str){
    *       return { object parsed from str };
    *     };
    * 
    */

  exports.parse = {
      'application/x-www-form-urlencoded': parseString
    , 'application/json': JSON.parse
  };

  /**
   * Parse the given header `str` into
   * an object containing the mapped fields.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */

  function parseHeader(str) {
    var lines = str.split(/\r?\n/)
      , fields = {}
      , index
      , line
      , field
      , val;

    lines.pop(); // trailing CRLF

    for (var i = 0, len = lines.length; i < len; ++i) {
      line = lines[i];
      index = line.indexOf(':');
      field = line.slice(0, index).toLowerCase();
      val = trim(line.slice(index + 1));
      fields[field] = val;
    }

    return fields;
  }

  /**
   * Return the mime type for the given `str`.
   *
   * @param {String} str
   * @return {String}
   * @api private
   */

  function type(str){
    return str.split(/ *; */).shift();
  };

  /**
   * Return header field parameters.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */

  function params(str){
    return str.split(/ *; */).reduce(function(obj, str){
      var parts = str.split(/ *= */)
        , key = parts.shift()
        , val = parts.shift();

      if (key && val) obj[key] = val;
      return obj;
    }, {});
  };

  /**
   * Initialize a new `Response` with the given `xhr`.
   *
   *  - set flags (.ok, .error, etc)
   *  - parse header
   *
   * Examples:
   *
   *  Aliasing `superagent` as `request` is nice:
   *
   *      request = superagent;
   *
   *  We can use the promise-like API, or pass callbacks:
   *
   *      request.get('/').end(function(res){});
   *      request.get('/', function(res){});
   *
   *  Sending data can be chained:
   *
   *      request
   *        .post('/user')
   *        .send({ name: 'tj' })
   *        .end(function(res){});
   *
   *  Or passed to `.send()`:
   *
   *      request
   *        .post('/user')
   *        .send({ name: 'tj' }, function(res){});
   *
   *  Or passed to `.post()`:
   *
   *      request
   *        .post('/user', { name: 'tj' })
   *        .end(function(res){});
   *
   * Or further reduced to a single call for simple cases:
   *
   *      request
   *        .post('/user', { name: 'tj' }, function(res){});
   *
   * @param {XMLHTTPRequest} xhr
   * @param {Object} options
   * @api private
   */

  function Response(xhr, options) {
    options = options || {};
    this.xhr = xhr;
    this.text = xhr.responseText;
    this.setStatusProperties(xhr.status);
    this.header = parseHeader(xhr.getAllResponseHeaders());
    this.setHeaderProperties(this.header);
    this.body = this.parseBody(this.text);
  }

  /**
   * Set header related properties:
   *
   *   - `.type` the content type without params
   *
   * A response of "Content-Type: text/plain; charset=utf-8"
   * will provide you with a `.type` of "text/plain".
   *
   * @param {Object} header
   * @api private
   */

  Response.prototype.setHeaderProperties = function(header){
    // content-type
    var ct = this.header['content-type'] || '';
    this.type = type(ct);

    // params
    var obj = params(ct);
    for (var key in obj) this[key] = obj[key];
  };

  /**
   * Parse the given body `str`.
   *
   * Used for auto-parsing of bodies. Parsers
   * are defined on the `superagent.parse` object.
   *
   * @param {String} str
   * @return {Mixed}
   * @api private
   */

  Response.prototype.parseBody = function(str){
    var parse = exports.parse[this.type];
    return parse
      ? parse(str)
      : null;
  };

  /**
   * Set flags such as `.ok` based on `status`.
   *
   * For example a 2xx response will give you a `.ok` of __true__
   * whereas 5xx will be __false__ and `.error` will be __true__. The
   * `.clientError` and `.serverError` are also available to be more
   * specific, and `.statusType` is the class of error ranging from 1..5
   * sometimes useful for mapping respond colors etc.
   *
   * "sugar" properties are also defined for common cases. Currently providing:
   *
   *   - .noContent
   *   - .badRequest
   *   - .unauthorized
   *   - .notAcceptable
   *   - .notFound
   *
   * @param {Number} status
   * @api private
   */

  Response.prototype.setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = status;
    this.statusType = type;

    // basics
    this.info = 1 == type;
    this.ok = 2 == type;
    this.clientError = 4 == type;
    this.serverError = 5 == type;
    this.error = 4 == type || 5 == type;

    // sugar
    this.accepted = 202 == status;
    this.noContent = 204 == status || 1223 == status;
    this.badRequest = 400 == status;
    this.unauthorized = 401 == status;
    this.notAcceptable = 406 == status;
    this.notFound = 404 == status;
  };

  /**
   * Expose `Response`.
   */

  exports.Response = Response;

  /**
   * Initialize a new `Request` with the given `method` and `url`.
   *
   * @param {String} method
   * @param {String} url
   * @api public
   */
  
  function Request(method, url) {
    var self = this;
    EventEmitter.call(this);
    this.method = method;
    this.url = url;
    this.header = {};
    this.set('X-Requested-With', 'XMLHttpRequest');
    this.on('end', function(){
      self.callback(new Response(self.xhr));
    });
  }

  /**
   * Inherit from `EventEmitter.prototype`.
   */

  Request.prototype = new EventEmitter;
  Request.prototype.constructor = Request;

  /**
   * Set header `field` to `val`, or multiple fields with one object.
   *
   * Examples:
   *
   *      req.get('/')
   *        .set('Accept', 'application/json')
   *        .set('X-API-Key', 'foobar')
   *        .end(callback);
   *
   *      req.get('/')
   *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
   *        .end(callback);
   *
   * @param {String|Object} field
   * @param {String} val
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.set = function(field, val){
    if (isObject(field)) {
      for (var key in field) {
        this.set(key, field[key]);
      }
      return this;
    }
    this.header[field.toLowerCase()] = val;
    return this;
  };

  /**
   * Set Content-Type to `type`, mapping values from `exports.types`.
   *
   * Examples:
   *
   *      superagent.types.xml = 'application/xml';
   *
   *      request.post('/')
   *        .type('xml')
   *        .send(xmlstring)
   *        .end(callback);
   *      
   *      request.post('/')
   *        .type('application/xml')
   *        .send(xmlstring)
   *        .end(callback);
   *
   * @param {String} type
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.type = function(type){
    this.set('Content-Type', exports.types[type] || type);
    return this;
  };

  /**
   * Add `obj` to the query-string, later formatted
   * in `.end()`.
   *
   * @param {Object} obj
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.query = function(obj){
    this._query = this._query || {};
    for (var key in obj) {
      this._query[key] = obj[key];
    }
    return this;
  };

  /**
   * Send `data`, defaulting the `.type()` to "json" when
   * an object is given.
   *
   * Examples:
   *
   *       // querystring
   *       request.get('/search')
   *         .send({ search: 'query' })
   *         .end(callback)
   *
   *       // multiple data "writes"
   *       request.get('/search')
   *         .send({ search: 'query' })
   *         .send({ range: '1..5' })
   *         .send({ order: 'desc' })
   *         .end(callback)
   *
   *       // manual json
   *       request.post('/user')
   *         .type('json')
   *         .send('{"name":"tj"})
   *         .end(callback)
   *       
   *       // auto json
   *       request.post('/user')
   *         .send({ name: 'tj' })
   *         .end(callback)
   *       
   *       // manual x-www-form-urlencoded
   *       request.post('/user')
   *         .type('form')
   *         .send('name=tj')
   *         .end(callback)
   *       
   *       // auto x-www-form-urlencoded
   *       request.post('/user')
   *         .type('form')
   *         .send({ name: 'tj' })
   *         .end(callback)
   *
   * @param {String|Object} data
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.send = function(data){
    if ('GET' == this.method) return this.query(data);
    var obj = isObject(data);

    // merge
    if (obj && isObject(this._data)) {
      for (var key in data) {
        this._data[key] = data[key];
      }
    } else {
      this._data = data;
    }

    if (!obj) return this;
    if (this.header['content-type']) return this;
    this.type('json');
    return this;
  };

  /**
   * Initiate request, invoking callback `fn(res)`
   * with an instanceof `Response`.
   *
   * @param {Function} fn
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.end = function(fn){
    var self = this
      , xhr = this.xhr = getXHR()
      , query = this._query
      , data = this._data;

    // store callback
    this.callback = fn || noop;

    // state change
    xhr.onreadystatechange = function(){
      if (4 == xhr.readyState) self.emit('end');
    };

    // querystring
    if (query) {
      query = exports.serializeObject(query);
      this.url += ~this.url.indexOf('?')
        ? '&' + query
        : '?' + query;
    }

    // initiate request
    xhr.open(this.method, this.url, true);
    
    self.emit('xhr:opened', xhr);

    // body
    if ('GET' != this.method && 'HEAD' != this.method) {
      // serialize stuff
      var serialize = exports.serialize[this.header['content-type']];
      if (serialize) data = serialize(data);
    }

    // set header fields
    for (var field in this.header) {
      xhr.setRequestHeader(field, this.header[field]);
    }

    // send stuff
    xhr.send(data);
    return this;
  };
  
  /**
   * Expose `Request`.
   */
  
  exports.Request = Request;

  /**
   * Issue a request:
   *
   * Examples:
   *
   *    request('GET', '/users').end(callback)
   *    request('/users').end(callback)
   *    request('/users', callback)
   *
   * @param {String} method
   * @param {String|Function} url or callback
   * @return {Request}
   * @api public
   */

  function request(method, url) {
    // callback
    if ('function' == typeof url) {
      return new Request('GET', method).end(url);
    }

    // url first
    if (1 == arguments.length) {
      return new Request('GET', method);
    }

    return new Request(method, url);
  }

  /**
   * GET `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.get = function(url, data, fn){
    var req = request('GET', url);
    if (isFunction(data)) fn = data, data = null;
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * GET `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.head = function(url, data, fn){
    var req = request('HEAD', url);
    if (isFunction(data)) fn = data, data = null;
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * DELETE `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.del = function(url, fn){
    var req = request('DELETE', url);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * POST `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.post = function(url, data, fn){
    var req = request('POST', url);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  /**
   * PUT `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.put = function(url, data, fn){
    var req = request('PUT', url);
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
  };

  module.exports = exports;
  return exports;
  
}({});

}); // module: wantworthy/browser/superagent.js

requireSync.register("wantworthy/browser/underscore.js", function(module, exports, require){
//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

}); // module: wantworthy/browser/underscore.js

requireSync.register("wantworthy/resource.js", function(module, exports, require){
var Wantworthy = require("../wantworthy"),
    resourceful = require("./resourceful"),
    _ = require('wantworthy/browser/underscore');

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

Resource._request = require('wantworthy/browser/superagent');

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
}); // module: wantworthy/resource.js

requireSync.register("wantworthy/resourceful.js", function(module, exports, require){
var _ = require('wantworthy/browser/underscore');

var resourceful = exports;

resourceful.resources  = {};
resourceful.Resource   = require('./resource').Resource;

resourceful.define = function (name) {

  var Factory = function Factory (attrs) {
    var self = this;

    resourceful.Resource.call(this, attrs);

    // explicitly set the construct to the Factory function, required for older versions of safari
    // card https://trello.com/card/not-working-in-safari-5-0-5/4fc7df8742d5291c3fb1c3f6/80
    if(Object.getPrototypeOf) {
      Object.getPrototypeOf(this).constructor = Factory;
    } else {
      this.__proto__.constructor = Factory;
    }
  };

  //
  // Setup inheritance
  //
  _.extend(Factory, resourceful.Resource);
  _.extend(Factory.prototype, resourceful.Resource.prototype);

  // Factory.__proto__ = resourceful.Resource;
  // Factory.prototype.__proto__ = resourceful.Resource.prototype;

  //
  // Setup defaults
  //
  Factory.resource  = name;
  Factory.version = "1.0";
  Factory.links = {};
  Factory.schema = {};

  resourceful.register(name, Factory);

  return Factory;
};

resourceful.register = function (name, Factory) {
  return this.resources[name] = Factory;
};

resourceful.setDescription = function(description) {
  var self = this;

  Object.keys(description.resources).forEach(function(resourceName) {
    var singularName = resourceName.substr(0, resourceName.length-1);

    var Factory = self.resources[singularName];
    if(!Factory) {
      return;
    }

    Factory.links.self = {href : description.resources[resourceName].url};
    Factory.schema.mediaType = description.schema[Factory.version][singularName].mediaType;
    Factory.schema.description = description.schema[Factory.version][singularName].description;
  });
};
}); // module: wantworthy/resourceful.js

requireSync.register("wantworthy/resources/account.js", function(module, exports, require){
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

Account.getEmpty = function (callback) {
  return this.get('empty', callback);
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

Account.prototype.setProfilePicCrop = function (cropSelection, callback) {
  var r = this.constructor._request
    .put(this.url() + '/profilepic')
    .send(cropSelection)
    .set(this.auth())
    .set('Accept', this.constructor.schema.mediaType)
    .on('error', callback)
    ;
  this.constructor.acceptCookiesFor(r);
  r.end(this.constructor.parseResponse(callback));
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

/* "OK, so, what the hell is this?" I hear you asking. Well, this is a total hack
 *   to get around caching issues right after a users uploads a new profile picture
 *   or re-crops their existing one.
 * Whenever an image is uploaded or cropped, setProfilePicKey() is called, which sets
 *   a new random key. This random key is appended to the profile pic URL whenever
 *   'newKey' is passed as 'true'. Otherwise, no random key is included in the image
 *   URL. 'newKey' is only set to true when a user is viewing their own profile or list
 *   so there is no caching issue for public viewing of the images and since the key
 *   only changes when there is a change to the profile pic, the image would need to
 *   be releaded by the profile owner anyway
 */
Account._profilePicKey = Math.random();
Account.prototype.setProfilePicKey = function (newKey) {
  //If no new key is passed in, generate a random one
  Account._profilePicKey = newKey || Math.random();
};
Account.prototype.getProfilePicKey = function (newKey) {
  if (!Account._profilePicKey) {
    this.setProfilePicKey();
  }
  return Account._profilePicKey;
};

Account.prototype.hasCustomProfilePic = function () {
  return !!this.get('profile_pic_exists');
};

Account.prototype.getProfilePic = function (size, useKey) {
  size = size || 'large';
  return this.links.images.profile[size] + (!!useKey ? ('?x=' + this.getProfilePicKey()) : '');
};

Account.prototype.getProfilePicOriginal = function (useKey) {
  return this.getProfilePic('original', useKey);
};

Account.prototype.getProfilePicLarge = function (useKey) {
  return this.getProfilePic('large', useKey);
};

Account.prototype.getProfilePicSmall = function (useKey) {
  return this.getProfilePic('small', useKey);
};

Account.prototype.getLastProfilePicCropSelection = function () {
  //TODO: make defaults configurable
  return {
    x1: this.get('profile_pic_crop_x1') || 1,
    y1: this.get('profile_pic_crop_y1') || 1,
    x2: this.get('profile_pic_crop_x2') || 200,
    y2: this.get('profile_pic_crop_y2') || 90
  }
};

}); // module: wantworthy/resources/account.js

requireSync.register("wantworthy/resources/comment.js", function(module, exports, require){
var resourceful = require("../resourceful");
var Resource = require("../resource").Resource;

var Comment = exports.Comment = resourceful.define("comment");

Comment.createForProduct = function (attrs, callback) {
  var r = this._request
    .post(this.url(null, { productID: attrs.productID }))
    .set('Accept', this.schema.mediaType)
    .set(this.auth())
    .on('error', callback);

  if(this.withCredentials.create){
    Resource.acceptCookiesFor(r);
  }

  r.send(attrs).end(this.parseResponse(callback));
};

Comment.getForProduct = function (productID, callback) {
  var r = this._request
    .get(this.url(null, { productID: productID }))
    // .set('Accept', this.schema.mediaType)
    .set(this.auth())
    .on('error', callback);

  if(this.withCredentials.create){
    Resource.acceptCookiesFor(r);
  }

  r.send().end(this.parseResponse(callback));
};

//This is because resourceful is using underscore's extend() rather than
//  leveraging the prototype chain
Comment._origParseResponse = Comment.parseResponse;
Comment.parseResponse  = function (callback) {
  return this._origParseResponse.call(this, function (err, comments) {
    if (err) {
      return callback(err);
    }
    comments.comments = comments.comment;
    delete comments.comment;
    callback(null, comments);
  });
};

}); // module: wantworthy/resources/comment.js

requireSync.register("wantworthy/resources/group.js", function(module, exports, require){
var resourceful = require("../resourceful"),
    _ = require('wantworthy/browser/underscore');

var Group = exports.Group = resourceful.define("group");

Group.list = function(accountID, callback) {
  this._request
    .get(this.url() + "/" + accountID)
    .on('error', callback)
    // .set('Accept', this.schema.mediaType)
    .end(this.parseResponse(callback));
};

Group.prototype.rename = function(name, callback) {
  this.set({"name" : name});

  this.constructor._request
    .post(this.url())
    .set(this.auth())
    .on('error', callback)
    .send({name : name})
    .end(this.constructor.parseResponse(callback));
};

Group.prototype.addProduct = function(productID, callback) {
  var productIds = this.get("productIds") || [];
  productIds.push(productID);

  this.set("productIds", productIds);

  this.constructor._request
    .put(this.url())
    .set(this.auth())
    .on('error', callback)
    .send({productID : productID})
    .end(this.constructor.parseResponse(callback));
};

Group.prototype.removeProduct = function(productID, callback) {
  var productIds = this.get("productIds") || [];
  productIds = _.without(productIds, productID);
  
  this.set("productIds", productIds);

  this.constructor._request
    .del(this.url() + "/" + productID)
    .set(this.auth())
    .on('error', callback)
    .send({productID : productID})
    .end(this.constructor.parseResponse(callback));
};
}); // module: wantworthy/resources/group.js

requireSync.register("wantworthy/resources/product.js", function(module, exports, require){
var resourceful = require("../resourceful");

var Product = exports.Product = resourceful.define("product");

Product.search = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  //TODO: fix the 'Accept' for product sets
  this._request
    .get(this.url())
    .send(options)
    .on('error', callback)
    // .set('Accept', this.schema.mediaType)
    .end(this.parseResponse(callback));
};

Product.prototype.comments = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  this.constructor._request
    .get(this.url("comments"))
    .send(options)
    .set(this.auth())
    .on('error', callback)
    .end(this.constructor.parseResponse(callback));
};

}); // module: wantworthy/resources/product.js

requireSync.register("wantworthy/resources/scraper.js", function(module, exports, require){
var resourceful = require("../resourceful");

var Scraper = exports.Scraper = resourceful.define("scraper");

Scraper.stats = function(callback) {
  this._request
    .get(this.url() + "/stats")
    .on('error', callback)
    .set(this.auth())
    .end(this.parseResponse(callback));
};

Scraper.search = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  this._request
    .get(this.url())
    .send(options)
    .set(this.auth())
    .on('error', callback)
    .end(this.parseResponse(callback));
};
}); // module: wantworthy/resources/scraper.js

requireSync.register("wantworthy/resources/session.js", function(module, exports, require){
var resourceful = require("../resourceful");

var Session = exports.Session = resourceful.define("session");

Session.withCredentials = {
  get : true,
  create : true,
  update : true,
  destroy : true
};

Session.prototype.isAdmin = function() {
  if(this.account && this.account.has('roles') ) {
    return Boolean(~this.account.get('roles').indexOf("admin"))
  } else if(this.account) {
    return new RegExp(/@wantworthy.com/).test(this.account.get("email"));
  } else {
    return false;
  }
};

Session.get = function (token, callback) {
  var r = this._request
    .get(this.url())
    .set('Accept', this.schema.mediaType)
    .on('error', callback);

  if(token) r.set('Authorization', "token " + token);

  this.acceptCookiesFor(r);
  
  r.end(this.parseResponse(callback));
};
}); // module: wantworthy/resources/session.js

requireSync.register("wantworthy/resources/store.js", function(module, exports, require){
var resourceful = require("../resourceful");

var Store = exports.Store = resourceful.define("store");

Store.stats = function(callback) {
  this._request
    .get(this.url() + "/stats")
    .on('error', callback)
    .set(this.auth())
    .end(this.parseResponse(callback));
};

Store.search = function(options, callback) {
  if (!callback || typeof callback != "function") {
    callback = options;
    options = {};
  }

  this._request
    .get(this.url())
    .send(options)
    .set(this.auth())
    .on('error', callback)
    .end(this.parseResponse(callback));
};
}); // module: wantworthy/resources/store.js


  return requireSync('wantworthy');
});