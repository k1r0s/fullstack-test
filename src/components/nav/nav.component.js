var Class = require("kaop/Class");
var Component = require("../../common/component");

module.exports = Nav = Class.inherits(Component, {
  selector: "x-nav",
  template: require('./nav.component.ejs'),
  css: require('./nav.component.css'),
  props: { profile: null },
  constructor: ["override", function(parent){
    parent(this.props);
  }],
  "listen profile-mode": function(profile){
    this.set("title", profile.props.routeName, true);
    this.set("profile", true);
  },
  "listen list-mode": function(){
    this.set("profile", false);
  },
  "click a.back": function(){
    this.navigate("/");
  }
})
