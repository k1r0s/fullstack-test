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
    this.set("messages", [], true);
    this.set("currentSession", storage.read("session"), true);
    this.messagesHandler({
      fromId: this.props.currentSession.id,
      toId: this.props.selectedProfile.id
    });
    this.messagesHandler({
      toId: this.props.currentSession.id,
      fromId: this.props.selectedProfile.id
    });
    // random message
    setTimeout(function(){
      this.addMessageHandler({
        "fromId": this.props.selectedProfile.id,
        "toId": 3,
        "content": "Hi, how are you! Wana some turing test?",
        "timestamp": Date.now()
      });
    }.bind(this), 1500);

  }],
  "click a.send": ["$valueof: '.textbox-container>input'", function(inputValue){
    if(!inputValue) { return; }
    this.addMessageHandler({
      "fromId": 3,
      "toId": this.props.selectedProfile.id,
      "content": inputValue,
      "timestamp": Date.now()
    });
  }],
  addMessageHandler: ["$sessionCreate: 'messages'", function(request, responseData){
    this.props.messages.push(responseData);
    this.set("messages", this.props.messages);
  }],
  messagesHandler: ["$sessionRead: 'messages'", function(request, responseData){
    this.set("messages", this.props.messages.concat(responseData));
  }]
})
