var Session = require("../../lib/wantworthy").Session,
    helper = require("../test-helper").TestHelper,
    chai = require('chai'),
    should = chai.should();

describe("Session Resource", function() {
  describe("Is Admin", function(){
    it("should return true for account with wantworthy email address", function(){
      var s = Session.new(helper.adminSession);
      s.isAdmin().should.be.true;
    });

    it("should return true for account with admin role", function(){
      var s = Session.new(helper.adminRoleSession);
      s.isAdmin().should.be.true;  
    });

    it("should return false for standard session", function(){
      var s = Session.new(helper.session);
      s.isAdmin().should.be.false;
    });
    
  });
});