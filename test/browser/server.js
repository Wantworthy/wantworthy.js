var helper = require("../test-helper").TestHelper,
    fs = require('fs'),
    path = require('path'),
    express = require('express'),
    app = express.createServer();

app.use(express.bodyParser());
app.use(cors);

app.get('/', function(req, res){
  res.send(helper.mockDescription);
});

app.get("/wantworthy.js", function(req, res) {
  res.setHeader('Content-type', "application/javascript");
  fs.createReadStream(path.join(__dirname, "../../wantworthy.js")).pipe(res);
});

function cors(req, res, next){
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Max-Age', '*');
  if(req.method === 'OPTIONS') {
    res.send("", 200);
  } else {
    next();
  }
};

app.use(express.static(path.join(__dirname, "../../")));

app.listen(5055);
console.log('Test server listening on port 5055');