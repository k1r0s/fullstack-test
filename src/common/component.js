var Class = require("kaop/Class");
var uuid = require("uuid/v1");

module.exports = Component = Class.inherits(HTMLElement, {
  selector: "x-base",
  uid: 0,
  el: null,
  css: null,
  template: "",
  html: "/empty/",
  props: {},
  constructor: [function(props) {
    this.props = props;
  }, "$setupListeners"],
  navigate: function(newUrl){
    newUrl = "#" + newUrl
    location.hash = newUrl;
  },
  set: function(key, val, silent) {
    this.props[key] = val;
    if(silent) {return;}
    this.invalidate(this.template);
  },
  root: function() {
    var tmpNode = document.createElement(this.selector);
    this.uid = uuid();
    tmpNode.setAttribute("id", this.uid);
    var htmlRoot = tmpNode.outerHTML;
    this.html = htmlRoot;
    setTimeout(this.invalidate, 0, this.template);
    setTimeout(this.afterMount, 1);
    return htmlRoot;
  },
  invalidate: ["$ejsCompile", function(rawTemplate, compTemplate) {
    if (!this.el) {
      this.el = document.getElementById(this.uid);
    }
    this.replaceContent(compTemplate);
  }, "$registerDomListeners"],
  replaceContent: function(rawhtml) {
    if(this.css) {
      rawhtml += "<style>" + this.css + "</style>";
    }

    if(this.el) {
      this.el.innerHTML = rawhtml;
    }
  },
  q: function(selector, all) {
    if (all) {
      return (this.el || document).querySelectorAll(selector);
    }
    return (this.el || document).querySelector(selector);
  },
  afterMount: function(){}
})
