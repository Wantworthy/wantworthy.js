describe("Api Browser Test", function() {
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
})