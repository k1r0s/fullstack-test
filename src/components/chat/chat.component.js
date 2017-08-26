var Class = require("kaop/Class");
var Profile = require("../profile/profile.component");
var storage = require("../../services/storage");

module.exports = Chat = Class.inherits(Profile, {
  selector: "x-chat",
  template: require('./chat.component.ejs'),
  css: require('./chat.component.css'),
  constructor: ["override", function(parent, props){
    props.messages = [];
    parent(props);
    // kaop bug >.<!
    this.css = require('./chat.component.css');
  }],
  isRenderAllowed: ["override", function(parent){
    return this.props.messages instanceof Array &&
    this.props.currentSession &&
    parent();
  }],
  afterMount: ["override", function(parent){
    parent();
    this.set("currentSession", storage.read("session"), true);
    this.messagesHandler({
      fromId: this.props.currentSession.id,
      toId: this.props.selectedProfile.id
    });
  }],
  "click a.send": ["$valueof: '.textbox-container>input'", function(inputValue){
    console.log(inputValue);
  }],
  messagesHandler: ["$GET: 'messages'", function(request, responseData){
    this.set("messages", responseData);

    setTimeout(function(){
      this.props.messages.push({
        "fromId": 4,
        "toId": 3,
        "content": "Prueba de mierda, si, esto es pruebasldhldfhas lasdhflds hfajdhflakjdshjashdf dfdsaf adf!",
        "timestamp": Date.now()
      })
      this.set("messages", this.props.messages);
    }.bind(this), 2000);
  }]
})
