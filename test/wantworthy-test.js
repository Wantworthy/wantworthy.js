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

    it("should make get session request with null token", function(done) {
      wantworthy.api.discover = function(cb) {
        cb(null, helper.mockDescription);
      };

      Wantworthy.Session.get = function(token, cb){
        should.not.exist(token);
        cb(null, null);
      };

      wantworthy.start(done);
    });

    it("should make get session request", function(done) {
      wantworthy.api.discover = function(cb){
        cb(null, helper.mockDescription);
      };

      Wantworthy.Session.get = function(token, cb){
        token.should.equal(helper.session.token);
        cb(null, helper.session);
      };

      wantworthy.start(helper.session.token, done);
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