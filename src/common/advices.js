var Advices = require("kaop/Advices");
var EventEmitter = require("./event-emitter");

Advices.locals.$EJS = require("ejs");
Advices.locals.$EJS.delimiter = "?";
Advices.locals.$axiosInstance = require("../services/request");
Advices.locals.$session = require("../services/sessionService");
Advices.locals.$EE = new EventEmitter();

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
  function $sessionCreate(resource) {
    meta.args.push($session.create(resource, meta.args[0]));
  },
  function $sessionRead(resource) {
    meta.args.push($session.read(resource, meta.args[0]));
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
    for (var prop in meta.scope) {
      if (meta.scope.hasOwnProperty(prop) && typeof meta.scope[prop] === "function") {
        meta.scope.on(prop, meta.scope[prop]);
      }
    }
  }
)
