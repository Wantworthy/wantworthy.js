var API = require("../lib/wantworthy/api").API;
    helper = require("./test-helper").TestHelper,
    nock = require('nock'),
    chai = require('chai'),
    should = chai.should();

describe("API", function() {
  var api, apiServer;

  beforeEach(function(){
    apiServer = nock(helper.API_URL);
    api = new API({url : helper.API_URL});
  });

  describe("Discover", function() {

    it("should return api server description", function(done) {
      apiServer.get('/').reply(200, helper.mockDescription, {'content-type': 'application/json'});

      api.discover(function(err, description) {
        api.description.should.eql(helper.mockDescription);
        done();
      });

    });   

    it("should return error when 503 Service unavailable response", function(done) {
      apiServer.get('/').reply(503, "Service unavailable");

      api.discover(function(err, description) {
        err.message.should.equal("Service unavailable");
        done();
      });

    });
  });

});