var Session = require("../lib/wantworthy/resources/session").Session,
    helper = require("./test-helper").TestHelper,
    chai = require('chai'),
    should = chai.should();

describe("Session Resource", function() {
  describe("Is Admin", function(){
    it("should return true for account with wantworthy email address", function(){
      var s = new Session(helper.adminSession);
      s.isAdmin().should.be.true;  
    });

    it("should return true for account with admin role", function(){
      var s = new Session(helper.adminRoleSession);
      s.isAdmin().should.be.true;  
    });

    it("should return false for standard session", function(){
      var s = new Session(helper.session);
      s.isAdmin().should.be.false;
    });
    
  });
});