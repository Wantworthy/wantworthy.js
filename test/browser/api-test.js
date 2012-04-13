describe("Api", function() {
  var should = chai.should(),
      wantworthy;

  beforeEach(function() {
    wantworthy = TestHelper.createWantworthyClient();
  });

  describe("Discover", function() {

    it("should return api server description", function(done) {
      wantworthy.api.discover(function(err, description) {
        should.exist(description);
        wantworthy.api.description.url.should.equal(TestHelper.urlFor('description'));
        wantworthy.api.description.should.eql(description);
        done();
      });

    });
  });

  describe("Login", function() {
    beforeEach(function() {
      wantworthy.api.setDescription(TestHelper.mockDescription);
    });

    it("should return session for valid email/pass", function(done){
      var creds = TestHelper.credentials;

      wantworthy.api.login(creds, function(err, session){
        session.should.eql(TestHelper.session);
        done();
      });
    });

  });  

  describe("Get Session", function() {
    beforeEach(function() {
      wantworthy.api.setDescription(TestHelper.mockDescription);
    });

    it("should return session", function(done){
      var session = TestHelper.session;

      wantworthy.api.getSession(session.token, function(err, session){
        session.should.eql(TestHelper.session);
        done();
      });
    });

  });

  describe("Create Product", function() {
    beforeEach(function() {
      wantworthy.api.setDescription(TestHelper.mockDescription);
    });

    it("should return created product", function(done){
      var session = TestHelper.session,
          prodAttrs = {name : "nike prod", url: "http://nike.com/p1"};
      
      wantworthy.api.createProduct(prodAttrs, session.token, function(err, product){
        product.should.eql(TestHelper.nikeProduct);
        done();
      });
    });

    it("should return 401 unauthorized", function(done){
      var invalidToken = "invalidTokenString",
          prodAttrs = {name : "nike prod", url: "http://nike.com/p1"};
      
      wantworthy.api.createProduct(prodAttrs, invalidToken, function(err, product){
        err.message.should.equal("unauthorized");
        done();
      });
    });

  });

  
  describe("Get Products", function() {
    beforeEach(function() {
      wantworthy.api.setDescription(TestHelper.mockDescription);
    });

    it("should return products", function(done){
      var account = TestHelper.session.resources.account;

      wantworthy.api.getProducts({accountID : account.id}, function(err, products){
        products.should.eql(TestHelper.products);
        done();
      });
    });

  });  
})