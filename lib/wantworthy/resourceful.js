var resourceful = exports;

resourceful.resources  = {};
resourceful.Resource   = require('./resource').Resource;

resourceful.define = function (name) {

  var Factory = function Factory (attrs) {
    var self = this;

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