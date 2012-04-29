var _ = require('underscore');

var resourceful = exports;

resourceful.resources  = {};
resourceful.Resource   = require('./resource').Resource;

resourceful.define = function (name) {

  var Factory = function Factory (attrs) {
    var self = this;

    self.links = {};
    self.attributes = {};

    if(attrs && attrs._embedded) {
      Object.keys(attrs._embedded).forEach(function(resourceName){
        if(resourceful.resources[resourceName]) {
          if(_.isArray(attrs._embedded[resourceName])) {
            self[resourceName]  =  _.map(attrs._embedded[resourceName], function(r){ return new(resourceful.resources[resourceName])(r)});
          } else {
            self[resourceName] = new(resourceful.resources[resourceName])(attrs._embedded[resourceName]);
          }
        } else {
          self[resourceName] = attrs._embedded[resourceName];
        }
      });

      delete attrs._embedded;
    };

    if(attrs && attrs._links) {
      self.links = attrs._links;
      delete attrs._links;
    }
    
    self.attributes = attrs;
    resourceful.Resource.call(this, attrs);
  };

  //
  // Setup inheritance
  //
  Factory.__proto__ = resourceful.Resource;
  Factory.prototype.__proto__ = resourceful.Resource.prototype;

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

    Factory.links["self"] = {href : description.resources[resourceName].url};
    Factory.schema.mediaType = description.schema[Factory.version][singularName].mediaType;
    Factory.schema.description = description.schema[Factory.version][singularName].description;
  });
};