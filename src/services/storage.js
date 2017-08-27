module.exports = {
  read: function(key) {
    return JSON.parse(sessionStorage.getItem(key));
  },
  write: function(key, value) {
    sessionStorage.setItem(key, value ? JSON.stringify(value) : "{}");
  },
  remove: function(key) {
    delete sessionStorage[key];
  }
}
