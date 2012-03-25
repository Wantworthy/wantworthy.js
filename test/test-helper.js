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
      console.warn('route doesnt exist: ' + name);
      return null;
    } else{
      return resource.url;
    }
  };

  TestHelper.testUser = {
    email: "test@test.com",
    password: "test123"
  };

  TestHelper.session = {
    token: 'cR5xrr80EmkJ1okQSXCGNJJ31Iw=',
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

})(typeof process !== "undefined" && process.title ? module.exports : window);