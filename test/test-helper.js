
var API_URL = exports.API_URL = "https://127.0.0.1:9000";

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
        "mediaType":"application/vnd.spire-io.session+json;version=1.0"
      }
    }
  }
}