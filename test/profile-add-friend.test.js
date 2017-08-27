var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });
var assert = require('assert');

describe("profile-add-friend.test", function(){

  beforeEach(function(){
    nightmare
      .goto('http://localhost:4400/#/profile/Aby')
  })

  it("e2e test 2", function(done){
    nightmare
      .wait("a.add-friend")
      .click("a.add-friend")
      .wait(".profile-content.isFriend")
      .evaluate(function () {
          return document.querySelector(".add-friend").innerHTML;
      })
      .end()
      .then(function (result) {
        assert(result.search("Remove friend") > -1);
        done();
      })
      .catch(function (error) {
        throw error;
      });

  })
})
