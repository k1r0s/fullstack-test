var Class = require("kaop/Class");
var Profile = require("../profile/profile.component");
var storage = require("../../services/storage");

module.exports = Chat = Class.inherits(Profile, {
  selector: "x-chat",
  template: require('./chat.component.ejs'),
  selectProfile: ["override", function(parent){
    this.set("currentSession", storage.read("session"), true);
    parent();
  }]
})
