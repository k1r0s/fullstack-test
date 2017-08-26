require("./common/advices");
var App = require("./components/app/app.component");
var Nav = require("./components/nav/nav.component");
var AppRouter = require("./components/app-router/app-router.component");
var Home = require("./components/home/home.component");
var Profile = require("./components/profile/profile.component");
var Chat = require("./components/chat/chat.component");
var storage = require("./services/storage");
var app = new App();

document.body.querySelector("#app").innerHTML = app.root();

storage.write("session", {
  "name": "Ciro Ivan",
  "email": "ciro.asd@zz.net",
  "pass": "1234",
  "city": "Alcoi",
  "dob": 656550000000,
  "profileImg": "https://avatars2.githubusercontent.com/u/6052309?v=4&s=460"
});
