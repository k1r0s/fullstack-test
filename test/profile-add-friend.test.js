var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });
var assert = require('assert');

describe("profile-add-friend.test", function(){

  beforeEach(function(){
    nightmare
      .goto('http://localhost:4400/#/profile/Aby')
  })

  it("e2e test 2", function(done){
  })
})
