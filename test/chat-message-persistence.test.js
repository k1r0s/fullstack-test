var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });
var assert = require('assert');

describe("chat-persistence.test", function(){

  beforeEach(function(){
    nightmare
      .goto('http://localhost:4400/#/profile/Aby')
  })

  it("e2e test 2", function(done){
    nightmare
      .wait(".profile-image img")
      .click(".profile-image img")
      .wait(".message-item.from-selection")
      .type(".textbox-container input", "Sueñan los androides con ovejas mecánicas?")
      .click("a.send")
      .wait(".message-item.from-session")
      .goto('http://localhost:4400/#/profile/Aby')
      .wait(".profile-image img")
      .click(".profile-image img")
      .wait(".message-item.from-session")
      .evaluate(function () {
          return document.querySelector(".message-item.from-session").innerHTML;
      })
      .end()
      .then(function (result) {
        assert(result.search("Sueñan los androides con ovejas mecánicas?") > -1);
        done();
      })
      .catch(function (error) {
        throw error;
      });
  })
})
