var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = Profile = Class.inherits(Component, {
  selector: "x-profile",
  template: require('./profile.component.ejs'),
  css: require('./profile.component.css'),
  props: { selectedProfile: null, routeName: null },
  constructor: ["override", function(parent, props){
    props.routeName = props.name;
    props.selectedProfile = null;
    parent(props);
  }],
  isRenderAllowed: function(){
    return this.props.selectedProfile;
  },
  "listen update-profiles": function(){
    this.selectProfile();
  },
  "click .profile-image>img": function(){
    this.navigate("/chat/" + this.props.routeName);
  },
  "click .add-friend": function(){
    this.props.selectedProfile.friend = !this.props.selectedProfile.friend;
    this.addFriendHandler(this.props.selectedProfile);
  },
  addFriendHandler: ["$PUT: 'profiles'", function(request, responseData){
    this.set("selectedProfile", responseData);
  }],
  selectProfile: function(){
    if(this.props.routeName === "Me") {
      this.set("selectedProfile", storage.read("session"));
    } else if(storage.read("profiles")) {
      this.set("selectedProfile", storage.read("profiles")
      .find(this.profileMatcherPredicate));
    } else {
      console.log("profile not found");
    }
  },
  afterMount: function(){
    this["listen update-profiles"]();
  },
  profileMatcherPredicate: function(prof){
    return prof.name === this.props.routeName;
  }
})
