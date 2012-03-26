var Wantworthy = require("../lib/wantworthy"),
    helper = require("./test-helper").TestHelper,
    chai = require('chai'),
    should = chai.should();

describe("Wantworthy.js", function() {
  var wantworthy;

  beforeEach(function(){
    wantworthy = new Wantworthy({url : helper.API_URL});
  });

  describe('start', function(){
    it("should make discover request", function(done) {
      wantworthy.api.discover = function(){
        done();
      };

      wantworthy.start();
    });

    it("should NOT make get session request", function(done) {
      wantworthy.api.discover = function(cb) {
        cb();
      };

      wantworthy.api.getSession = function(token, cb){
        throw new Error("Get Session Called");
      };

      wantworthy.start(done);
    });

    it("should make get session request", function(done) {
      var mockSession = {token : "123456", account : {email :"test@test.com"}};

      wantworthy.api.discover = function(cb){
        cb();
      };

      wantworthy.api.getSession = function(token, cb){
        token.should.equal(mockSession.token);
        cb();
      };

      wantworthy.start(mockSession.token, done);
    });

    it("should return error", function(done) {
      wantworthy.api.discover = function(callback){
        callback(new Error("fail"));
      };

      wantworthy.start(function(err) {
        err.message.should.equal('fail');
        done();
      });

    });
  });
});