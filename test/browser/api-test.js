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
})