var Class = require("kaop/Class");
var Profile = require("../profile/profile.component");

module.exports = Chat = Class.inherits(Profile, {
  selector: "x-chat",
  template: require('./chat.component.ejs')
})
