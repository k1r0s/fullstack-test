var http = require("http");
var assert = require('assert');

describe("put-profile.test", function(){
  it("test 1", function(done){
    var Mario;
    function get(end){
      http.get("http://localhost:8080/profiles", function(response) {
        // Continuously update stream with data
        var body = "";
        response.on("data", function(d) {
            body += d;
        });
        response.on("end", function() {
            var parsed = JSON.parse(body);
            Mario = parsed.find(function(prof){ return prof.name === "Mario"; })
            put();
            if(end) {
              assert(parsed.length === 4);
              assert(Mario.pass === "barracuda");
              done();
            }
        });
      });
    }
    function put(){
      Mario.pass = "barracuda";

      const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/profiles',
        method: 'PUT'
      };

      const req = http.request(options, function(res) {
        get(true);
        Mario.pass === "asdfasdf";
      });

      // write data to request body
      req.write(JSON.stringify(Mario));
      req.end();
    }

    get();
  })
})
