var Wantworthy = require("../lib/wantworthy"),
    helper = require("./test-helper"),
    should = require('should');

describe("Wantworthy Client", function() {
  var client;

  beforeEach(function() {
    client = new Wantworthy.Client({url : helper.API_URL});
  });

  it("should make discover request on init", function(done) {
    client.api.discover = function(){
      done();
    };

    client.init();
  });  

  it("should set started to true on successful discover call", function(done) {
    client.api.discover = function(callback){
      callback();
    };

    client.started.should.be.false;

    client.init(function() {
      client.started.should.be.true;
      done();
    });
  });

  it("should not set started to true when discover call returns error", function(done) {
    client.api.discover = function(callback){
      callback(new Error("fail"));
    };

    client.started.should.be.false;

    client.init(function(err) {
      err.message.should.equal('fail');
      client.started.should.be.false;
      done();
    });

  });

});