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

      apiServer
        .matchHeader('accept', api.mediaType("session"))
        .matchHeader('Authorization', "token "+ token)
        .get("/sessions")
        .reply(200, helper.session, {'content-type': api.mediaType("session") });

      api.getSession(token, function(err, session) {
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

    it("should return 401 unauthorized", function(done){
      var invalidToken = "invalidTokenString",
          prodAttrs = {name : "nike prod", url: "http://nike.com/p1"};

      apiServer
        .matchHeader('accept', api.mediaType("product"))
        .matchHeader('Authorization', "token "+ invalidToken)
        .post("/products", prodAttrs)
        .reply(401, "unauthorized");

      api.createProduct(prodAttrs, invalidToken, function(err, product){
        err.message.should.equal("unauthorized");
        done();
      });

    });
  });

  describe("Get Products", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should return products by account id", function(done){
      var account = helper.session._embedded.account;
      var testProducts = [helper.nikeProduct, helper.amazonProduct, helper.bestbuyProduct];

      apiServer
        .matchHeader('accept', api.mediaType("products"))
        .get("/products?accountID=" + account.id)
        .reply(200, testProducts, {'content-type': api.mediaType("products") });

      api.getProducts({accountID: account.id}, function(err, products) {
        products.should.have.length(3);
        done();
      });
    });

    it("should get products by account id and purchased", function(done){
      var account = helper.session._embedded.account;
      var testProducts = [helper.nikeProduct, helper.amazonProduct];

      apiServer
        .matchHeader('accept', api.mediaType("products"))
        .get("/products?accountID=" + account.id + "&purchased=true")
        .reply(200, testProducts, {'content-type': api.mediaType("products") });

      api.getProducts({accountID: account.id, purchased:true}, function(err, products) {
        products.should.have.length(2);
        done();
      });
    });

  });

  describe("Update Product", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should return updated product", function(done){
      var token = helper.session.token;

      apiServer
        .matchHeader('accept', api.mediaType("product"))
        .matchHeader('Authorization', "token "+ token)
        .put("/products/123", {purchased : true})
        .reply(200, helper.nikeProduct, {'content-type': api.mediaType("product") });

      api.updateProduct(123, {purchased: true}, token, function(err, product){
        product.should.eql(helper.nikeProduct);
        done();
      });
    });
  });

  describe("Delete Product", function() {
    beforeEach(function() {
      api.setDescription(helper.mockDescription);
    });

    it("should make delete request", function(done){
      var token = helper.session.token;

      apiServer
        .matchHeader('Authorization', "token "+ token)
        .delete("/products/123")
        .reply(200, 'OK');

      api.deleteProduct(123, token, function(err){
        done();
      });
    });
  });

});