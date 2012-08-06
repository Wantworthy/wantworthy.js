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
