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
