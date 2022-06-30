const sqlite3 = require('sqlite3').verbose();

exports.open=function(path, flag) {
    return new Promise(function(resolve, reject) {
    var db = new sqlite3.Database(path, flag, function(err) {
            if(err) reject("Open error: "+ err.message);
            else    resolve(db);
        });
    });
}

// any query: insert/delete/update
exports.run=function(db, query, params) {
    return new Promise(function(resolve, reject) {
        db.run(query, params, function(err)  {
            if(err) reject(err.message);
            else    resolve(true);
        });
    });
}

// first row read
exports.get=function(db, query, params) {
    return new Promise(function(resolve, reject) {
        db.get(query, params, function(err, row)  {
            if(err) reject("Read error: " + err.message);
            else {
                resolve(row);
            }
        });
    });
}

// set of rows read
exports.all=function(db, query, params) {
    return new Promise(function(resolve, reject) {
        if(params == undefined) params=[];

        db.all(query, params, function(err, rows)  {
            if(err) reject("Read error: " + err.message);
            else {
                resolve(rows);
            }
        });
    });
}

// each row returned one by one
exports.each=function(db, query, params, action) {
    return new Promise(function(resolve, reject) {
        db.serialize(function() {
            db.each(query, params, function(err, row)  {
                if(err) reject("Read error: " + err.message);
                else {
                    if(row) {
                        action(row);
                    }
                }
            });
            db.get("", function(err, row)  {
                resolve(true);
            });
        });
    });
}

exports.close=function(db) {
    return new Promise(function(resolve, reject) {
        db.close();
        resolve(true);
    })
}
