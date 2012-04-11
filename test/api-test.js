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
      var creds = helper.credentials;

      apiServer.post("/sessions", creds).reply(201, helper.session, {'content-type': api.mediaType("session") });

      api.login(creds, function(err, session){
        session.should.eql(helper.session);
        done();
      });
    });
  });

  describe("Create Account", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should return new session and account", function(done){
      var regParams = helper.validRegisterParams();

      apiServer.post("/accounts", regParams).reply(201, helper.session, {'content-type': api.mediaType("session") });

      api.createAccount(regParams, function(err, session){
        session.should.eql(helper.session);
        done();
      });
    });

    it("should return error", function(done){
      var regParams = helper.validRegisterParams();
      var errResp = {"email":["Email address is already registered."]};

      apiServer.post("/accounts", regParams).reply(400, errResp, {'content-type': api.mediaType("session") });

      api.createAccount(regParams, function(err, session){
        err.should.eql(errResp);
        done();
      });
    });
  });

  describe("Get Session", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should return session for token", function(done){
      var token = helper.session.token;
      apiServer.get("/sessions/"+ token).reply(200, helper.session, {'content-type': api.mediaType("session") });

      api.getSession(token, function(err, session){
        session.should.eql(helper.session);
        done();
      });
    });
  });

  describe("Create Product", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should return created product", function(done){
      var token = helper.session.token,
          prodAttrs = {name : "nike prod", url: "http://nike.com/p1"};

      apiServer
        .matchHeader('accept', api.mediaType("product"))
        .matchHeader('Authorization', "token "+ token)
        .post("/products", prodAttrs)
        .reply(201, helper.nikeProduct, {'content-type': api.mediaType("product") });

      api.createProduct(prodAttrs, token, function(err, product){
        product.should.eql(helper.nikeProduct);
        done();
      });

    });
  });
});