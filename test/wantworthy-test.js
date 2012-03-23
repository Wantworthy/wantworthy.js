var Wantworthy = require("../lib/wantworthy"),
    helper = require("./test-helper"),
    chai = require('chai'),
    should = chai.should();

describe("Wantworthy.js", function() {
  var wantworthy;

  beforeEach(function(){
    wantworthy = new Wantworthy({url : helper.API_URL});
  });

  it("should make discover request on init", function(done) {
    wantworthy.api.discover = function(){
      done();
    };

    wantworthy.init();
  });  

  it("should set started to true on successful discover call", function(done) {
    wantworthy.api.discover = function(callback){
      callback();
    };

    wantworthy.started.should.be.false;

    wantworthy.init(function() {
      wantworthy.started.should.be.true;
      done();
    });
  });

  it("should not set started to true when discover call returns error", function(done) {
    wantworthy.api.discover = function(callback){
      callback(new Error("fail"));
    };

    wantworthy.started.should.be.false;

    wantworthy.init(function(err) {
      err.message.should.equal('fail');
      wantworthy.started.should.be.false;
      done();
    });

  });

});