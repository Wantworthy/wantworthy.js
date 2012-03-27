describe("Wantworthy.js", function() {
  var should = chai.should(),
      wantworthy;

  beforeEach(function() {
    wantworthy = TestHelper.createWantworthyClient();
  });

  describe("Start", function() {

    it("should make discover request", function(done) {
      wantworthy.start(function(err) {
        wantworthy.api.description.should.eql(TestHelper.mockDescription);
        done();
      });
    });

    it("should load up session", function(done) {
      wantworthy.start(TestHelper.session.token, function(err) {
        wantworthy.session.should.eql(TestHelper.session);
        done();
      });
    });

  });
})