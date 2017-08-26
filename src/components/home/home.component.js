var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = Home = Class.inherits(Component, {
  selector: "x-home",
  template: require('./home.component.ejs'),
  css: require('./home.component.css'),
  props: { profiles: [] },
  constructor: ["override", function(parent) {
    parent(this.props);
  }],
  "listen update-profiles": function(profiles){
    this.set("profiles", profiles);
  },
  afterMount: function(){
    this.getProfiles();
  },
  getProfiles: function(){
    var profiles = storage.read("profiles");
    this.set("profiles", profiles);
  }
})
