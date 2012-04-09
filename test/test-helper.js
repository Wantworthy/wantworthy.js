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

  TestHelper.session = {
    token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw',
    resources: {
      account: { 
        id: 60391,
        email: 'test@test.com',
        secret: 'y4bp6TeR2XJw6Shx2mnD',
        nickname: 'tester',
        first_name: "Tim",
        last_name: "Tester" 
      } 
    } 
  };

  TestHelper.adminSession = {
    token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw',
    resources: {
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
    resources: {
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

  TestHelper.validRegisterParams = function(){
    return {
      email : "test9123@test.com",
      password : "test123",
      nickname : "test912"
    };
  };

})(typeof process !== "undefined" && process.title ? module.exports : window);