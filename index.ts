require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const moment = require('moment');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const initPassport = require('./my_modules/passport-config');
const validateReg = require('./my_modules/validate-registration');
const putil = require('./my_modules/path-utils');
//https://www.npmjs.com/package/connect-pg-simple

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

//https://github.com/Jinzulen/TenorJS
const Tenor = require("tenorjs").client({
  "Key": process.env.TENOR_KEY, // https://developers.google.com/tenor/guides/quickstart
  "Filter": "off", // "off", "low", "medium", "high", not case sensitive
  "Locale": "en_US", // Your locale here, case-sensitivity depends on input
  "MediaFilter": "minimal", // either minimal or basic, not case sensitive
  "DateFormat": "D/MM/YYYY - H:mm:ss A" // Change this accordingly
});

var TenorIdsExists = function(id:string[]) {
  return new Promise<boolean>((Resolve, Reject) => {
    Tenor.Search.Find(id)
    .then(() => Resolve(true))
    .catch(() => Resolve(false));
  });
};

var app = express();
var port = process.env.PORT || 5000;

async function mainApp() {
  //connects to database
  const client = await pool.connect();

  var scene_count = (await client.query(`SELECT COALESCE(MAX(_id)+1, 0) FROM branches`)).rows.pop().coalesce;
  console.log("Total paths: "+scene_count);

  initPassport(passport,
    async email => (await client.query('SELECT * FROM users WHERE email = $1', [email])).rows.pop(),
    async id => (await client.query('SELECT * FROM users WHERE id = $1', [id])).rows.pop());

  //Static Files
  app.use(express.static('public'));
  app.use('/img', express.static(__dirname + 'public/img'));
  app.use('/css', express.static(__dirname + 'public/css'));
  app.use('/js', express.static(__dirname + 'public/js'));

  //Templating Engine
  app.set('view engine', 'ejs');
  
  //Middleware Configuration
  app.use(expressLayout);
  app.use(express.urlencoded({ extended: false }));
  app.use(flash());
  app.use(session({
    store: new (require('connect-pg-simple')(session))({
      pool: pool,
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 4 * 60 * 1000 } // 4 hours
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use((req, res, next) => {
    res.____render____ = res.render;
    res.render = function (view, options, fn) {
      res.locals.filename = view.split('\\').pop().split('/').pop();
      res.____render____(view, options, fn)
    }
    next();
  });
  app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.moment = moment;
    res.locals.scene_count = scene_count;
    if (req.isAuthenticated()) {
      res.locals.user = {
        username: req.user.username
      }
    }
    next();
  });

  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated())
      return next();
    res.redirect('/login');
  }

  function checkNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated())
      return next();
    res.redirect('/');
  }

  app.get('/', function (req, res) {
    res.render("home");
  });

  app.get('/login', checkNotAuthenticated, function (req, res) {
    res.render("login");
  });

  app.get('/register', checkNotAuthenticated, function (req, res) {
    res.render("register");
  });

  app.get('/account', checkAuthenticated, function (req, res) {
    res.render("account");
  });

  app.get('/logout', function (req, res) {
    res.redirect('/account');
  });

  app.get('/path/:id(\\d+)', async function (req, res) {
    var id:number = parseInt(req.params.id);
    var path = (await client.query('SELECT * FROM branches WHERE _id = $1', [id])).rows.pop();
    if (!path) {
      return res.redirect('/path/0');
    }
    
    //snippets with id equal to their parent is a flag to a create new branch
    var default_snippet = {_id: -1, snippet: "Create your action"};
    var return_snippet = {_id: path.parent_id, snippet: "Go Back!"};

    var snippets = [ default_snippet, default_snippet, default_snippet];
    if (path._id != 0) snippets.push(return_snippet); //only add return snippet if path is not root

    var snippets_fetched = (await client.query('SELECT _id,snippet FROM branches WHERE _id IN ($1,$2,$3)', [
      path.child_1_id || -1, path.child_2_id || -1, path.child_3_id || -1 ])).rows;

    for (var i = 0; i < snippets_fetched.length; i++)
      snippets[i] = snippets_fetched[i];

    res.render("path", { path, snippets });
  });

  app.get('/create/:id(\\d+)', checkAuthenticated, async function (req, res) {
    var parent_id:number = parseInt(req.params.id);
    var parent_path = (await client.query('SELECT * FROM branches WHERE _id = $1', [parent_id])).rows.pop();
    if (!parent_path) {
      return res.redirect('/');
    }

    var error = (function() {
      if (putil.NextFreeChild(parent_path) == 0)
        return 'There are no more children available!';
      return null;
    })();

    if (error) {
      return res.redirect('/path/'+parent_id);
    }

    res.render("create", { parent_path });
  });

  // non-standalone paths
  
  app.get('/guidelines', function(req, res) {
    res.render('guidelines');
  });

  app.post(['/path', '/create'], function(req, res) {
    var id:string = req.body.id || '0';
    if (id.match(/\d+/)) {
      res.redirect(req.url+'/'+id);
    } else {
      res.redirect('/');
    }
  });

  //User Registration
  app.post('/register', checkNotAuthenticated, async function (req, res) {
    var uname:string = req.body.username;
    var email:string = req.body.email;
    var rawPwd:string = req.body.password;

    var error = validateReg(email, uname, rawPwd);
    if (error != null)
      return res.render("register", {error});

    try {
      const hashPassword = await bcrypt.hash(rawPwd, 10);
      const values = [uname, email, hashPassword];
      await client.query('INSERT INTO users (username, email, password) VALUES($1,$2,$3);', values);
      res.redirect('/login');
    } catch (err) {
      res.redirect('/register');
    }
  });

  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.post('/logout', checkAuthenticated, function (req, res, next) {
    req.logOut(function(err) {
      if (err) return next(err);
    });
    res.redirect('/login');
  });

  app.post('/create/:id(\\d+)', checkAuthenticated, async function (req, res) {
    var user = req.user;

    var parent_id:number = parseInt(req.params.id);
    var parent_path = (await client.query('SELECT * FROM branches WHERE _id = $1', [parent_id])).rows.pop();

    var path = {
      _id: -1 as number,
      parent_id:  parent_id as number,
      creator_id: user.id as number,
      creator_name: user.username as string,
      snippet: req.body.snippet as string,
      body: req.body.body as string,
      tenor_gif: parseInt(req.body.tenor_gif),
      time: new Date().getTime()
    };

    //remove double spaces in string
    path.snippet = path.snippet.trim().replace(/\s{2,}/g, ' ');
    path.body = path.body.replace(/^[ ]+|[ ]+$/mg, '')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/[\r\n\t\f\v]+/g, '\\n');

    var freeChild = putil.NextFreeChild(parent_path);

    var error = await (async function() {
      if (freeChild == null)
        return `There are no more children available for parent path id = ${parent_id}!`;
      
      if (path.snippet == "" || path.body == "")
        return `Error: At least one of the fields is empty!`;
        
      if (path.snippet.length < 5 || path.snippet.length > 40)
        return `Error: Title length must be between 5 and 40 characters!`;

      if (path.body.length < 80 || path.body.length > 3000)
        return `Error: Description length must be between 80 and 3000 characters!`;

      if (path.tenor_gif == NaN || !(await TenorIdsExists([path.tenor_gif+''])))
        return `Error: Tenor GIF ID is invalid!`;

      return null;
    })();

    if (error) {
      return res.render('create', { parent_path, error });
    }

    var values = [path.parent_id, path.creator_id, path.creator_name, path.snippet, path.body, path.tenor_gif, path.time];

    path._id = (
    await client.query('INSERT INTO branches (parent_id,creator_id,creator_name,snippet,body,tenor_gif,creation_time_epoch) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING _id', values)).rows.pop()._id;
    await client.query(`UPDATE branches SET ${freeChild} = $1 WHERE _id = $2`, [path._id, parent_id]);
    
    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    await delay(1000);

    //inserts new path on database and update parent's child entry
    res.redirect('/path/'+path._id);
  });

  process.on('exit', function(code) {
    console.log("Shutting down server...");
    client.release();
    // db.close();
    console.log("Database saved!");
  });

  //handles ctrl+c
  process.on("SIGINT", function() {
    process.exit();
  });

  app.listen(port);
  console.log(`Server running on port ${port}`);
}

mainApp().catch((error) => {
  console.error(error);
});;