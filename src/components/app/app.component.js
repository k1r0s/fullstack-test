var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = App = Class.inherits(Component, {
  selector: "x-app",
  template: require('./app.component.ejs'),
  constructor: ["override", function(parent, props) {
    parent(props);
  }],
  afterMount: ["$GET: 'profiles'", function(profiles){
    storage.write("profiles", profiles);
    return profiles;
  }, "$emit: 'update-profiles'"]
})
