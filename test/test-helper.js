if(!Wantworthy) {
  var Wantworthy = require("../lib/wantworthy");
}

(function(exports) {
  var TestHelper = exports.TestHelper = {};

  var API_URL = TestHelper.API_URL = "http://api.dev.wantworthy.com:5055";

  TestHelper.createWantworthyClient = function() {
    return new Wantworthy({url: API_URL});
  };

  var description = TestHelper.mockDescription = {
    "url": API_URL + "/",
    "resources": {
      "sessions": {
        "url": API_URL + "/sessions"
      },
      "accounts": {
        "url": API_URL + "/accounts"
      },
      "products": {
        "url": API_URL + "/products"
      },
      "stores": {
        "url": API_URL + "/stores"
      },
      "scrapers": {
        "url": API_URL + "/scrapers"
      }
    },
    "schema":{
      "url": API_URL +"/schema",
      "1.0":{
        "session":{
          "description":"A gateway for accessing privileged resources",
          "mediaType":"application/vnd.wantworthy.session+json;version=1.0"
        },
        "account":{
          "description":"A account for use with the api",
          "mediaType":"application/vnd.wantworthy.account+json;version=1.0"
        },
        "store":{
          "description":"3rd party store",
          "mediaType":"application/vnd.wantworthy.store+json;version=1.0"
        },
        "product":{
          "description":"Product saved from a store",
          "mediaType":"application/vnd.wantworthy.product+json;version=1.0"
        },
        "products":{
          "description":"Collection of products",
          "mediaType":"application/vnd.wantworthy.products+json;version=1.0"
        },
        "scraper": {
          "description":"rules for scraping pages of a given store",
          "mediaType":"application/vnd.wantworthy.scraper+json;version=1.0"
        }
      }
    }
  };

  TestHelper.urlFor = function(resourceName) {
    if(resourceName === 'description') return description.url;

    var resource = description.resources[resourceName];
    if(!resource) {
      console.warn('route doesnt exist: ' + resourceName);
      return null;
    } else{
      return resource.url;
    }
  };

  TestHelper.mediaType = function(resourceName) {
    var schema = description.schema['1.0'][resourceName];
    if(!schema) {
      console.warn('resource doesnt exist: ' + resourceName);
      return null;
    } else{
      return schema.mediaType;
    }
  };

  TestHelper.credentials = {
    email: "test@test.com",
    password: "test123"
  };

  TestHelper.testUser = {
    email: "test@test.com",
    password: "test123",
    first_name: "Time",
    last_name: "Tester"
  };

  TestHelper.account = { 
    id: 60391,
    email: 'test@test.com',
    secret: 'y4bp6TeR2XJw6Shx2mnD',
    nickname: 'tester',
    first_name: "Tim",
    last_name: "Tester"
  };

  TestHelper.accountResponse = { 
    id: 60391,
    email: 'test@test.com',
    secret: 'y4bp6TeR2XJw6Shx2mnD',
    nickname: 'tester',
    first_name: "Tim",
    last_name: "Tester",

    _embedded : {
      session: {token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw'}
    }
  };

  TestHelper.session = {
    token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw',
    _embedded: {
      account: TestHelper.account
    }
  };

  TestHelper.adminSession = {
    token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw',
    _embedded: {
      account: {
        id: 60391,
        email: 'root@wantworthy.com',
        secret: 'y4bp6TeR2XJw6Shx2mnD',
        nickname: 'adminer',
        first_name: "Ad",
        last_name: "Min" 
      } 
    } 
  };

  TestHelper.adminRoleSession = {
    token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw',
    _embedded: {
      account: {
        id: 87654,
        email: 'bob@bob.com',
        secret: 'y4bp6TeR2XJw6Shx2mnD',
        nickname: 'adminer',
        first_name: "Bob",
        last_name: "Bobber",
        roles : ['admin']
      }
    }
  };

  TestHelper.nikeProduct = {
    "id":"a4705e6f2f2ad251daeee91526dd3bea",
    "accountID":TestHelper.account.id,
    "name":"test nike product",
    "brand":"Nike",
    "price":"$44.00",
    "url":"http://www.nike.com/products/shirt",
    "domain":"nike.com",
    "currency":"USD",
    "ctime":1334159775886,
    "purchased":false
  };

  TestHelper.amazonProduct = {
    "id":"84e00d538f44bb58f70229625675d282",
    "accountID":TestHelper.account.id,
    "name":"test amazon product",
    "brand":"Amazon",
    "price":"$45.99",
    "url":"http://www.amazon.com/product/shirt-123",
    "domain":"amazon.com",
    "currency":"USD",
    "ctime":1334243881161,
    "purchased":false
  };

  TestHelper.bestbuyProduct = {
    "id":"a1dd39557ba025979704b786bddd50bc",
    "accountID":TestHelper.account.id,
    "name":"test tv",
    "brand":"Song",
    "price":"$1201.99",
    "url":"http://www.bestbuy.com/tvs/sony-bravia.html",
    "domain":"bestbuy.com",
    "currency":"USD",
    "ctime":1334243881160,
    "purchased":false
   };

  TestHelper.products = [TestHelper.nikeProduct, TestHelper.amazonProduct, TestHelper.bestbuyProduct];

  TestHelper.validRegisterParams = function(){
    return {
      email : "test9123@test.com",
      password : "test123",
      nickname : "test912"
    };
  };

})(typeof process !== "undefined" && process.title ? module.exports : window);