var Class = require("kaop/Class");
var Router = require("../../common/router");

module.exports = AppRouter = Class.inherits(Router, {
  selector: "x-app-router",
  props: { default: "/profile/Aby", notFound: "/" },
  constructor: ["override", function(parent){
    parent(this.props);
  }],
  "route /": [function(){
    var home = new Home();
    return home;
  }, "$emit: 'list-mode'"],
  "route /chat/:name": [function(params){
    var chat = new Chat(params);
    return chat;
  }, "$emit: 'profile-mode'"],
  "route /profile/:name": [function(params){
    var profile = new Profile(params);
    return profile;
  }, "$emit: 'profile-mode'"],
})
