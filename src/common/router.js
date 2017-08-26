var Class = require("kaop/Class");
var Component = require("./component");
var path = require("path-parser");

module.exports = Router = Class.inherits(Component, {
  selector: "x-router",
  template: "",
  routePool: [],
  currentComponent: null,
  constructor: ["override", function(parent, props){
    parent(props);
    window.onhashchange = this.hashChange;
    setTimeout(this.navigate, 10, this.props.default);
    this.setup();
  }],
  setup: function(){
    Object.keys(this)
    .filter(function(prop){ return typeof this[prop] === "function"}.bind(this))
    .filter(function(prop){ return !prop.search("route ")})
    .forEach(function(prop){
      var route = prop.split(" ")[1];
      this.routePool.push({
        parser: new path(route),
        resolver: this[prop]
      })
    }, this);
  },
  navigate: function(newUrl){
    newUrl = "#" + newUrl
    if(newUrl === location.hash) {
      this.hashChange({ newURL: newUrl })
    } else {
      location.hash = newUrl;
    }
  },
  hashChange: function(e){
    var selectedRoute = e.newURL.split("#")[1];
    var selectedMatcher = this.routePool.find(function(matcher){
      var result = matcher.parser.test(selectedRoute);
      if(result) {
        this.currentComponent = matcher.resolver.call(this, result);
        this.replaceContent(this.currentComponent.root());
      }
      return !!result;
    }.bind(this))

    if(!selectedMatcher) {
      this.navigate(this.props.notFound || this.props.default);
    }
  }
})
