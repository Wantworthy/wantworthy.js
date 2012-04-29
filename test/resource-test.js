var helper = require("./test-helper").TestHelper,
    resourceful = require("../lib/wantworthy/resourceful");
    nock = require('nock'),
    chai = require('chai'),
    should = chai.should();

describe("Resource", function() {
  var apiServer,
      Product;

  beforeEach(function() {
    apiServer = nock(helper.API_URL);
    Product = resourceful.define("product");

    resourceful.setDescription(helper.mockDescription);
  });

  describe("class methods", function() {
    describe("GET", function() {
      
      it("should get resource by id", function(done) {
        apiServer.get('/products/1234').reply(200, helper.amazonProduct, {'content-type': Product.schema.mediaType});

        Product.get("1234", function(err, product){
          product.get('id').should.equal(helper.amazonProduct.id);
          done();
        });
        
      });

    });
  });

  describe("instance methods", function() {
    
    describe("get attribute", function() {
      
      it("should get attributes", function() {
        var p = new Product({name :"test shirt", brand : "nike" });

        p.get("name").should.equal("test shirt");
      });
    });

    describe("set attribute", function() {
      
      it("should set simple key value", function() {
        var p = new Product({name :"test shirt", brand : "nike" });
        p.set("brand", "rebok");

        p.get("brand").should.equal("rebok");
      });

      it("should set by object", function() {
        var p = new Product({name :"test shirt", brand : "nike" });
        p.set({ brand :"rebok", name : "shoes"});

        p.get("brand").should.equal("rebok");
        p.get("name").should.equal("shoes");
      });

    });

    describe("has attribute", function() {
      
      it("should return true", function() {
        var p = new Product({name :"test shirt", brand : "nike" });

        p.has("name").should.equal(true);
      });

      it("should return false", function() {
        var p = new Product({name :"test shirt", brand : "nike" });

        p.has("url").should.equal(false);
      });
    });


    describe("is new", function() {
      
      it("should return true", function() {
        var p = new Product({name : "foo"});
        p.isNew().should.be.true;
      });

      it("should return false", function() {
        var p = new Product({name : "foo"});
        p.links.self = {href  : "http://api.wantworthy.com/products/123"};
        p.isNew().should.be.false;
      });
    });

    describe("save", function() {
      
      it("should create new resource", function(done) {
        var p = new Product({name : "foo"});

        apiServer.post('/products', p.toJSON()).reply(200, helper.amazonProduct, {'content-type': Product.schema.mediaType});
        
        p.save(function(err, prod){
          prod.get('id').should.equal(helper.amazonProduct.id);
          done();
        });
      });

      it("should update existing product", function(done) {
        var p = new Product({name : "existing"});
        p.links.self = {href : Product.url() + "/12345"};
        
        apiServer.put("/products/12345", p.toJSON()).reply(200, helper.amazonProduct, {'content-type': Product.schema.mediaType});
        
        p.save(function(err, prod){
          prod.get('id').should.equal(helper.amazonProduct.id);
          done();
        });
      });

    });
    
  });

});