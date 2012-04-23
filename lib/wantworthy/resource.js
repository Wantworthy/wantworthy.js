
var Resource = exports.Resource = function (attrs) {
  this._attributes = attrs;
};

Resource.get = function (id, callback) {
  return callback(null, id);
};

Resource.new = function (attrs) {
  return new(this)(attrs);
};