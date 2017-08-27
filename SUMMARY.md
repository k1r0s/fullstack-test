### Requirements

This app requires several software packages nodejs, mysql, php-mysql, php5, php5-cli..

this is what I done so far:

`$ history | grep install`

```
1852  sudo apt-get install mysql-client-5.5 mysql-server-5.5
1887  sudo apt-get install php5-cli
1893  sudo apt-get install php-mysql
1895  sudo apt-get install php5-mysql
1958  sudo apt-get install php5.5 php5.5-dev
```

You should install nodejs to run npm commands and package scripts.

Once you have all the requirements you should do `npm install` to retrieve all deps

### Tasks

You should look `package.json`

```
"build:dev": "browserify -t [ stringify --extensions [.ejs .css] ] ./src/init.js -o ./dist/app.dev.js",
"serve:app": "http-server -p 4400 dist/",
"serve:json": "json-server --watch ./db.json --port 8080",
"serve:php": "php -S localhost:8080 -t ./back-php back-php/api.php",
"reset:database": "./back-php/create_database",
"mysql:login": "mysql -u root -papasswordveryhardtowrite"
```
- `npm run build:dev` merge all javascript modules in a bundle, outputs/replace current bundle (needed to dev)
- `npm run serve:app` deploy a minimal static server on dist folder
- `npm run serve:json` run a minimal server with fake API having db.json data
- `npm run serve:php` launch a minimal php restful server  
- `npm run reset:database` destroy cmpteam database and refill again with the sql creation script
- `mysql:login` sortcut cmd to fast login into mysql-cli, depending on which password you have ...

> To run de app you may run serve:json or serve:php, and serve:app

### Show me the code!

```
.
├── back-php                Where php lives (back)
├── db.json                 Fake data (dev purpose)
├── dist                    Where build take place
├── node_modules            Nodejs dependencies
├── package.json            NPM config file
├── src                     Where js lives (front)
└── SUMMARY.md              ...
```

### What would I done differently :\

Brief:

IMO too few criteria and screen behavior description, for example I made a "home" screen which is not required because it makes sense to navigate through profiles.

Also, since no info is provided about how to retrieve a "session" I hardcoded on the backend but "messages" resource is a bit messy since you have to perform two calls to retrieve whole message collection for one conversation. This was not by design but I realize too late about that. Well, the project has some falls in design since I focused a lot on technical aspects, like build a whole js framework (lol), rather than how app behaves in terms of domain/business.

(I think the decision about ban frameworks was great).

If this was a real project:

- write more tests
- login screen
- use php 7 instead of 5
- provide a real session with php
- endpoints have a relationship with current session (/messages?fromId=xx to retrieve whole conversation)
- finish all the API endpoints, now only used enpoints do work (IE you cannot post a profile)
- use virtualdom instead of ejs
- bundle splitting (isnt too big yet, but..)
- bundle minification
- use a css framework
- use a real frontend framework

### Contact

`ciroreed@gmail.com`

Thanks!
