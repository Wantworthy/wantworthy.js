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
        wantworthy.session.token.should.eql(TestHelper.session.token);
        wantworthy.session.account._attributes.should.eql(TestHelper.session._embedded.account);
        done();
      });
    });

  });

  describe('Register', function(){
    beforeEach(function(done){
      wantworthy.start(done);
    });

    it("should create return session with new account", function(done) {
      var regParams = TestHelper.validRegisterParams();

      wantworthy.register(regParams, function(err, account){
        account.session.token.should.eql(TestHelper.session.token);
        wantworthy.session.token.should.eql(TestHelper.session.token);
        done();
      });
      
    });
  });  

  describe('Login', function(){
    beforeEach(function(done){
      wantworthy.start(done);
    });

    it("should create and set new session", function(done) {
      var creds = TestHelper.credentials;

      wantworthy.login(creds, function(err, session){
        session.token.should.eql(TestHelper.session.token);
        wantworthy.session.token.should.eql(TestHelper.session.token);
        done();
      });
      
    });
  });
})