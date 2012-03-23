var Wantworthy = require("../lib/wantworthy"),
    helper = require("./test-helper"),
    should = require('should');

describe("Wantworthy.js", function() {

  it("should create and initialize a new client", function(done) {
    Wantworthy.Client.prototype.init = function(callback){
      callback(null);
    };

    Wantworthy.createClient({url : helper.API_URL}, function(err, client){
      client.api.url.should.equal(helper.API_URL);
      done();
    });
  });

});