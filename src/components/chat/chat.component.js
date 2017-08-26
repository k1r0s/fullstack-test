var Class = require("kaop/Class");
var Component = require("../../common/component");

module.exports = Chat = Class.inherits(Component, {
  selector: "x-chat",
  template: require('./chat.component.ejs')
})
