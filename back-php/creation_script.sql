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
  `dob` DATE NOT NULL,
  `profileImg` varchar(250) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fromId` varchar(20) NOT NULL,
  `toId` varchar(20) NOT NULL,
  `content` varchar(200) NOT NULL,
  `timestamp` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

CREATE TABLE IF NOT EXISTS `session` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `email` varchar(20) NOT NULL,
  `pass` varchar(20) NOT NULL,
  `city` varchar(50) NOT NULL,
  `dob` DATE NOT NULL,
  `profileImg` varchar(250) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `profiles` (`name`, `email`, `online`, `friend`, `pass`, `city`, `dob`, `profileImg`) VALUES
("Josefi", "josefi.asd@zz.net", 1, 0, "1234", "Albacete", "1973-12-03", "img/4928749237942.jpg"),
("Joe", "joe.asd@zz.net", 1, 1, "1234", "Lisboa", "1996-04-03", "img/123123123.jpg"),
("Aby", "aby.asd@zz.net", 0, 0, "1234", "Niza", "1988-08-20", "img/98981497843.jpg"),
("Mario", "mario.asd@zz.net", 1, 1, "1234", "Milan", "1989-05-15", "img/231123221.jpg");

INSERT INTO `session` (`id`, `name`, `email`, `pass`, `city`, `dob`, `profileImg`) VALUES
(227, "Ciro Ivan", "ciro.asd@zz.net", "1234", "Barcelona", "1990-09-22", "https://avatars2.githubusercontent.com/u/6052309?v=4&s=460");
