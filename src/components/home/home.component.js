var Class = require("kaop/Class");
var Component = require("../../common/component");

module.exports = Home = Class.inherits(Component, {
  selector: "x-home",
  template: require('./home.component.ejs'),
  css: require('./home.component.css'),
  props: { profiles: [] },
  "listen update-profiles": function(profiles){
  }
})

/*

<? this.props.profiles.forEach(function(profile) { ?>
  <a href="#/profile/<?= profile.name ?>"><?= profile.name ?></a>
<? }) ?>

*/
