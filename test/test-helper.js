
var API_URL = exports.API_URL = "http://api.dev.wantworthy.com:9000";

exports.nock = require('nock');

exports.mockDescription = {
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

exports.testUser = {
  email: "test@test.com",
  password: "test123"
}

exports.session = {
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
}