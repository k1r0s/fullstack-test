var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = App = Class.inherits(Component, {
  selector: "x-app",
  template: require('./app.component.ejs'),
  constructor: ["override", function(parent, props) {
    parent(props);
  }],
  afterMount: function(profiles){
    this.sessionHandler();
  },
  profilesHandler: ["$GET: 'profiles'", function(profiles){
    storage.write("profiles", profiles);
    return profiles;
  }, "$emit: 'update-profiles'"],
  sessionHandler: ["$GET: 'session'", function(session){
    storage.write("session", session);
    this.profilesHandler();
  }, "$emit: 'update-session'"],
})
