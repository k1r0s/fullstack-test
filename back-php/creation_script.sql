DROP DATABASE IF EXISTS `teamcmp`;

CREATE DATABASE `teamcmp`;

use `teamcmp`;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `online` TINYINT(1) NOT NULL,
  `friend` TINYINT(1) NOT NULL,
  `email` varchar(20) NOT NULL,
  `pass` varchar(20) NOT NULL,
  `city` varchar(50) NOT NULL,
  `dob` int(10) unsigned NOT NULL,
  `profileImg` varchar(250) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fromId` varchar(20) NOT NULL,
  `toId` varchar(20) NOT NULL,
  `content` varchar(200) NOT NULL,
  `timestamp` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

CREATE TABLE IF NOT EXISTS `session` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `email` varchar(20) NOT NULL,
  `pass` varchar(20) NOT NULL,
  `city` varchar(50) NOT NULL,
  `dob` int(10) unsigned NOT NULL,
  `profileImg` varchar(250) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `profiles` (`name`, `email`, `pass`, `city`, `dob`, `profileImg`) VALUES
("Josefi", "josefi.asd@zz.net", "1234", "Albacete", 129832800000, "img/4928749237942.jpg"),
("Joe", "joe.asd@zz.net", "1234", "Lisboa", 621452840000, "img/123123123.jpg"),
("Aby", "aby.asd@zz.net", "1234", "Niza", 721521803400, "img/98981497843.jpg"),
("Mario", "mario.asd@zz.net", "1234", "Milan", 601022840100, "img/231123221.jpg");

INSERT INTO `session` (`name`, `email`, `pass`, `city`, `dob`, `profileImg`) VALUES
("Ciro Ivan", "ciro.asd@zz.net", "1234", "Barcelona", 656550000000, "https://avatars2.githubusercontent.com/u/6052309?v=4&s=460");
