var API = require("../lib/wantworthy/api").API;
    helper = require("./test-helper").TestHelper,
    nock = require('nock'),
    chai = require('chai'),
    should = chai.should();

describe("API", function() {
  var api;
  var apiServer = nock(helper.API_URL);

  beforeEach(function(){
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

  describe("Login", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should return session for valid email/pass", function(done){
      var creds = {email : "test@test.com", password : "test123"};

      apiServer.post("/sessions", creds).reply(201, helper.session, {'content-type': api.mediaType("session") });

      api.login(creds, function(err, session){
        session.should.eql(helper.session);
        done();
      });
    });

  });
});