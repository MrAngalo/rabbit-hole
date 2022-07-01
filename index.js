const express = require('express');
const bodyParser = require('body-parser');
const moment = require("moment");
const fs = require('fs');
require('dotenv').config();
// const sqlite3 = require('sqlite3').verbose();
// const aasqlite = require("./my_modules/aa-sqlite/aasqlite");

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function mainApp() {

  var app = express();
  var port = process.env.PORT || 5000;

  // if (!fs.existsSync("./database")) {
  //   fs.mkdirSync("./database");
  //   fs.copyFileSync("./template.db", "./database/main.db");
  // }

  // const db = await aasqlite.open('./database/main.db', sqlite3.OPEN_READWRITE);
  //create table branches if does not exist
  // await aasqlite.run(db, ''
  //   +'CREATE TABLE IF NOT EXISTS "branches" ('
  //   +'"_id"	INTEGER,'
  //   +'"parent_id"	INTEGER NOT NULL,'
  //   +'"child_1_id"	INTEGER,'
  //   +'"child_2_id"	INTEGER,'
  //   +'"child_3_id"	INTEGER,'
  //   +'"creator_id"	TEXT,'
  //   +'"snippet"	TEXT NOT NULL,'
  //   +'"body"	TEXT NOT NULL,'
  //   +'"tenor_gif"	TEXT NOT NULL,'
  //   +'"is_leaf"	INTEGER NOT NULL,'
  //   +'"rating_pos"	INTEGER,'
  //   +'"rating_neg"	INTEGER,'
  //   +'"creation_time_epoch"	INTEGER,'
  //   +'PRIMARY KEY("_id" AUTOINCREMENT)'
  //   +');'
  // );

  //connects to database
  const client = await pool.connect();

  // var global_path_count = Object.values(await aasqlite.get(db, "SELECT COALESCE(MAX(_id)+1, 0) FROM branches"))[0];
  var global_path_count = (await client.query(`SELECT COALESCE(MAX(_id)+1, 0) FROM branches`)).rows[0].coalesce;

  console.log("Total paths: "+global_path_count);

  // const db_insert = 'INSERT INTO branches ('
  //   + '_id, parent_id, creator_id, snippet,'
  //   + 'tenor_gif, body, is_leaf, rating_pos, rating_neg, creation_time_epoch) '
  //   + 'VALUES(?,?,?,?,?,?,?,?,?,?)';

  // db.run(db_insert, [1, 1, "The First", "The First", "https://c.tenor.com/y-mhvsb2nTMAAAAd/nice-day-our-earth.gif", "You are lost<br>You see a tree, a rock, and a waterfall on the distance<br>What do you do?", 0, 69000, 0, new Date().getTime()], (err) => {
  //   if (err) return console.log(err.message);
  //
  //   console.log("a new row has been created");
  // });


  app.set('view engine', 'ejs');

  app.use('/public', express.static(__dirname + '/public'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use((req, res, next)=>{
    res.locals.moment = moment;
    next();
  });

  // res.render("path", {text: "hello"});
  //<%= text %>
  //<% locals.text || 'Default' %>
  app.get(['/', '/path', '/create'], function(req, res) {
    res.render("home");
  });

  app.post('/path', async function (req, res) {
    var user = req.body.name || "Anonymous";
    var id = req.body.id || 0;
    var prev_id = req.body.prev_id;

    var error = await (async function() {
      if (user.length > 15)
        return `Error: user cannot exceed 15 characters!`;

      if (isNaN(Number(id)) || Number(id) < 0 || Number(id) >= global_path_count)
        return `Error: path id=${id} does not exist!`;

      //success, no errors
      return null;
    })();

    if (error != null) {
      res.render("home", { err: error});
      return;
    }

    // var current_path = await aasqlite.get(db, 'SELECT * FROM branches WHERE _id = ?', [id]);
    var current_path = (await client.query('SELECT * FROM branches WHERE _id = $1', [id])).rows[0];

    //flag to create a new branch
    if (prev_id == id) {
      res.render("create", {user: user, parent_path: current_path});
      return;
    }
    //snippets with id equal to their parent is a flag to a create new branch
    var default_snippet = {_id: current_path._id, snippet: "Create your action"};
    var return_snippet = {_id: current_path.parent_id, snippet: "Go Back!"};

    var snippets = [ default_snippet, default_snippet, default_snippet];
    if (current_path._id != 0) snippets.push(return_snippet); //only add return snippet if path is not root

    // var snippets_fetched = await aasqlite.all(db, 'SELECT _id,snippet FROM branches WHERE _id IN (?,?,?)', [
    //   current_path.child_1_id || -1, current_path.child_2_id || -1, current_path.child_3_id || -1 ]);

    var snippets_fetched = (await client.query('SELECT _id,snippet FROM branches WHERE _id IN ($1,$2,$3)', [
      current_path.child_1_id || -1, current_path.child_2_id || -1, current_path.child_3_id || -1 ])).rows;

    for (var i = 0; i < snippets_fetched.length; i++)
      snippets[i] = snippets_fetched[i];

    res.render("path", { user: user, path: current_path, snippets: snippets});
  });

  app.post('/create', async function (req, res) {
    var parent_id = req.body.parent_id || "0";
    var user = req.body.creator_id || "Anonymous";
    var snippet = req.body.snippet || "";
    var body = req.body.body || "";
    var tenor_gif = req.body.tenor_gif || "";
    var is_leaf = req.body.is_leaf || "0";

    //remove double spaces in string
    user = user.trim().replace(/\s{2,}/g, ' ');
    snippet = snippet.trim().replace(/\s{2,}/g, ' ');
    body = body.replace(/^[ ]+|[ ]+$/mg, '').replace(/[ ]{2,}/g, ' ')
                .replace(/[\r\n\t\f\v]{3,}/g, '\\n\\n').replace(/[\r\n\t\f\v]+/g, '\\n');
    tenor_gif = tenor_gif.trim().replace(/\s{2,}/g, ' ');

    var parent_path;
    var free_child;

    var error = await (async function() {
      if (isNaN(Number(parent_id)) || Number(parent_id) < 0  || Number(parent_id) >= global_path_count)
        parent_id = "0"; //not an error because parent_path must exist for error page to load

      // parent_path = await aasqlite.get(db, 'SELECT * FROM branches WHERE _id = ?', [parent_id]);
      parent_path = (await client.query('SELECT * FROM branches WHERE _id = $1', [parent_id])).rows[0];

      if (snippet == "" || body == "" || tenor_gif == "")
        return `Error: At least one of the fields is empty!`;

      if (snippet.length < 5 || snippet.length > 40)
        return `Error: Snippet length must be between 5 and 40 characters!`;

      if (body.length < 80 || body.length > 3000)
        return `Error: Body length must be between 80 and 3000 characters!`;

      if (!tenor_gif.startsWith("https://c.tenor.com") || !tenor_gif.endsWith(".gif"))
        return `Error: Tenor Gif is invalid (source must be from tenor.com)`;

      var has_free_child = (function() {
        for (var i = 1; i <= 3; i++) {
          free_child = `child_${i}_id`;
          if (parent_path[free_child] == null)
            return true;
        }
        return false; //no free children
      })();

      if (!has_free_child)
        return `Error: Someone beat you to it, all children of parent path id=${parent_id} are filled!`;

      //sucess, no errors
      return null;
    })();

    if (error != null) {
      res.render("create", {user: user, parent_path: parent_path, current_path: req.body, err: error});
      return;
    }

    var current_id = global_path_count++; //get current global_path_count, then increment
    var now = new Date().getTime();

    //inserts new path on database and update parent's child entry
    var values = [current_id, parent_id, user, snippet, body, tenor_gif, is_leaf, now];

    // await aasqlite.run(db, 'INSERT INTO branches (_id, parent_id,creator_id,snippet,body,tenor_gif,is_leaf,creation_time_epoch) VALUES(?,?,?,?,?,?,?,?);', values);
    // await aasqlite.run(db, `UPDATE branches SET ${free_child} = ? WHERE _id = ?`, [current_id, parent_id]);
    await client.query('INSERT INTO branches (_id, parent_id,creator_id,snippet,body,tenor_gif,is_leaf,creation_time_epoch) VALUES($1,$2,$3,$4,$5,$6,$7,$8);', values);
    await client.query(`UPDATE branches SET ${free_child} = $1 WHERE _id = $2`, [current_id, parent_id]);


    console.log(`Created path=${current_id}: ${snippet}`);

    //sends user to parent path
    // var current_path = await aasqlite.get(db, 'SELECT * FROM branches WHERE _id = ?', [current_id]);
    var current_path = (await client.query('SELECT * FROM branches WHERE _id = $1', [current_id])).rows[0];

    //snippets with id equal to their parent is a flag to a create new branch
    var default_snippet = {_id: current_path._id, snippet: "Create your action"};
    var return_snippet = {_id: current_path.parent_id, snippet: "Go Back!"};

    var snippets = [ default_snippet, default_snippet, default_snippet];
    if (current_path._id != 0) snippets.push(return_snippet); //only add return snippet if path is not root

    // var snippets_fetched = await aasqlite.all(db, 'SELECT _id,snippet FROM branches WHERE _id IN (?,?,?)', [
    //   current_path.child_1_id || -1, current_path.child_2_id || -1, current_path.child_3_id || -1 ]);
    var snippets_fetched = (await client.query('SELECT _id,snippet FROM branches WHERE _id IN ($1,$2,$3)', [
      current_path.child_1_id || -1, current_path.child_2_id || -1, current_path.child_3_id || -1 ])).rows;

    for (var i = 0; i < snippets_fetched.length; i++)
      snippets[i] = snippets_fetched[i];

    res.render("path", { user: user, path: current_path, snippets: snippets});

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

  // tty.setRawMode(true);

  app.listen(port);
  console.log(`Server running on port ${port}`);
}

mainApp().catch((error) => {
  console.error(error);
});;

// db.close(sqlite3.OPEN_READWRITE, (err) => {
//   if (err) return console.log(err.message);
// });
