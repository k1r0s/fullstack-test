var Advices = require("kaop/Advices");
var rx = require("rx");
var EventEmitter = require("./event-emitter");

Advices.locals.$EJS = require("ejs");
Advices.locals.$EJS.delimiter = "?";
Advices.locals.$axiosInstance = require("../services/request");
Advices.locals.$EE = new EventEmitter();

var domClickSource = rx.Observable.fromEvent(document, "click");
var domKeydownSource = rx.Observable.fromEvent(document, "keydown");
var domChangeSource = rx.Observable.fromEvent(document, "change");

Advices.locals.$domSource = rx.Observable.merge(
  domClickSource,
  domKeydownSource,
  domChangeSource
);

Advices.add(
  function $emit(evid) {
    $EE.fire(evid, meta.result);
  },
  function $setupListeners() {
    var methods = Object.keys(meta.scope).filter(function(prop) { return typeof meta.scope[prop] === "function" })
    methods.filter(function(prop) { return prop.search("listen ") > -1 })
    .forEach(function(eventHandler){
      var evid = eventHandler.split(" ")[1];
      $EE.when(evid, meta.scope[eventHandler]);
    })
  },
  function $GET(resource) {
    $axiosInstance.get(resource, { params: meta.args[0] }).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $POST(resource) {
    $axiosInstance.post(resource, meta.args[0]).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $PUT(resource) {
    $axiosInstance.put(resource + "/" + meta.args[0].id, meta.args[0]).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $DEL(resource) {
    $axiosInstance.delete(resource + "/" + meta.args[0].id).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $ejsCompile() {
    if (!meta.scope.__compileFn) {
        meta.scope.__compileFn = $EJS.compile(meta.args[0], {
            context: meta.scope
        });
    }
    meta.args.push(meta.scope.__compileFn(null));
    next();
  },
  function $valueof(selector) {
    meta.args.unshift(meta.scope.q(selector).value);
  },
  function $registerDomListeners() {
    var methods = Object.keys(meta.scope).filter(function(prop) { return typeof meta.scope[prop] === "function" })
    methods.filter(function(prop) { return prop.search("click ") > -1 })
    .forEach(function(eventHandler) {
      $domSource
      .filter(function(e){ return e.type === "click" })
      .filter(function(e) {
        var selector = eventHandler.split(" ")[1];
        return meta.scope.q(selector) && meta.scope.q(selector).outerHTML === e.target.outerHTML;
      })
      .subscribe(meta.scope[eventHandler])
    })
    // methods.filter(function(prop) { return prop.search("change ") > -1 })
    // .forEach(function(eventHandler) {
    //
    // })
    // methods.filter(function(prop) { return prop.search("keydown ") > -1 })
    // .forEach(function(eventHandler) {
    //
    // })
  }
)
