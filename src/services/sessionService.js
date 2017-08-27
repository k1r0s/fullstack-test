var storage = require("./storage");

function query(store, alike){
  return store.filter(function(item){
    var lookupKeys = Object.keys(alike);
    for (var i = 0, arrl = lookupKeys.length; i < arrl; i++) {
      if(item[lookupKeys[i]] !== alike[lookupKeys[i]]) {
        return false;
      }
    }
    return true;
  });
}

module.exports = {
  prefix: "x-session-",
  create: function(resource, subject){
      var store = storage.read(this.prefix + resource) || [];
      store.push(subject);
      storage.write(this.prefix + resource, store);
      return subject;
  },
  read: function(resource, alike){
    var store = storage.read(this.prefix + resource) || [];
    return query(store, alike);
  }
}
