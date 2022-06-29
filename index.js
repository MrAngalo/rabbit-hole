const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const moment = require("moment");

var app = express();
var port = process.env.PORT || 5000;
// var serv = require('http').Server(app);

const db = new sqlite3.Database('./database/main.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log(err.message);
});

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
app.get(['/', '/path'], function(req, res) {
  res.render("home");
});

app.post('/path', function (req, res) {
  var user = req.body.name || "Anonymous";
  var id = req.body.id || 0;
  var prev_id = req.body.prev_id;

  if (user.length > 15) {
    res.render("home", { err: `Error: user cannot exceed 15 characters!`});
    return;
  }

  if (isNaN(Number(id) || Number(id) < 0)) {
    res.render("home", { err: `Error: path id=${id} does not exist!`});
    return;
  }

  db.all('SELECT * FROM branches WHERE _id = ?', [id], function(err, rows) {
    if (err) return console.log(err.message);
    if (rows.length == 0) {
      res.render("home", { err: `Error: path id=${id} does not exist!`});
      return;
    }

    var path = rows[0];

    //flag to create a new branch
    if (prev_id == id) {
      res.render("create", {user: user, path: path});
      return;
    }
    //snippets with id equal to their parent is a flag to a create new branch
    var default_snippet = {_id: path._id, snippet: "Create your action"};
    var return_snippet = {_id: path.parent_id, snippet: "Go Back!"};
    var snippets = [ default_snippet, default_snippet, default_snippet];

    //only add return snippet if path is not root
    if (path._id != 0) snippets.push(return_snippet);

    var query_ids = [
      path.child_1_id || -1,
      path.child_2_id || -1,
      path.child_3_id || -1
    ];

    db.all('SELECT _id,snippet FROM branches WHERE _id IN (?,?,?)', query_ids, function(err2, rows2) {
      if (err2) return console.log(err.message);
      for (var i = 0; i < rows2.length; i++) {
        snippets[i] = rows2[i];
      }

      res.render("path", { user: user, path: path, snippets: snippets});
    });
  });
});

app.listen(port);
console.log(`Server running on port ${port}`);

// db.close(sqlite3.OPEN_READWRITE, (err) => {
//   if (err) return console.log(err.message);
// });
