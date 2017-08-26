var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = Profile = Class.inherits(Component, {
  selector: "x-profile",
  template: require('./profile.component.ejs'),
  css: require('./profile.component.css'),
  props: { selectedProfile: null, routeName: null },
  constructor: ["override", function(parent, props){
    this.props.routeName = props.name;
    parent(this.props);
  }],
  "listen update-profiles": function(){
    this.selectProfile();
  },
  selectProfile: function(){
    if(this.props.routeName === "me") {
      this.set("selectedProfile", storage.read("session"))
    } else if(storage.read("profiles")) {
      this.set("selectedProfile", storage.read("profiles")
      .find(this.profileMatcherPredicate));
    } else {
      console.log("profile not found");
    }
  },
  afterMount: function(){
    this.selectProfile();
  },
  profileMatcherPredicate: function(prof){
    return prof.name === this.props.routeName;
  }
})
