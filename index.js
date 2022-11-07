var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
require('dotenv').config();
var express = require('express');
var expressLayout = require('express-ejs-layouts');
var moment = require('moment');
var bcrypt = require('bcrypt');
var passport = require('passport');
var flash = require('express-flash');
var session = require('express-session');
var initPassport = require('./my_modules/passport-config');
var validateReg = require('./my_modules/validate-registration');
var putil = require('./my_modules/path-utils');
//https://www.npmjs.com/package/connect-pg-simple
var Pool = require('pg').Pool;
var pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
//https://github.com/Jinzulen/TenorJS
var Tenor = require("tenorjs").client({
    "Key": process.env.TENOR_KEY,
    "Filter": "off",
    "Locale": "en_US",
    "MediaFilter": "minimal",
    "DateFormat": "D/MM/YYYY - H:mm:ss A" // Change this accordingly
});
var TenorIdsExists = function (id) {
    return new Promise(function (Resolve, Reject) {
        Tenor.Search.Find(id)
            .then(function () { return Resolve(true); })["catch"](function () { return Resolve(false); });
    });
};
var app = express();
var port = process.env.PORT || 5000;
function mainApp() {
    return __awaiter(this, void 0, void 0, function () {
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
        var client, scene_count;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.connect()];
                case 1:
                    client = _a.sent();
                    return [4 /*yield*/, client.query("SELECT COALESCE(MAX(_id)+1, 0) FROM branches")];
                case 2:
                    scene_count = (_a.sent()).rows.pop().coalesce;
                    console.log("Total paths: " + scene_count);
                    initPassport(passport, function (email) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, client.query('SELECT * FROM users WHERE email = $1', [email])];
                            case 1: return [2 /*return*/, (_a.sent()).rows.pop()];
                        }
                    }); }); }, function (id) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, client.query('SELECT * FROM users WHERE id = $1', [id])];
                            case 1: return [2 /*return*/, (_a.sent()).rows.pop()];
                        }
                    }); }); });
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
                    app.use(function (req, res, next) {
                        res.____render____ = res.render;
                        res.render = function (view, options, fn) {
                            res.locals.filename = view.split('\\').pop().split('/').pop();
                            res.____render____(view, options, fn);
                        };
                        next();
                    });
                    app.use(function (req, res, next) {
                        res.locals.user = req.user;
                        res.locals.moment = moment;
                        res.locals.scene_count = scene_count;
                        if (req.isAuthenticated()) {
                            res.locals.user = {
                                username: req.user.username
                            };
                        }
                        next();
                    });
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
                    app.get('/path/:id(\\d+)', function (req, res) {
                        return __awaiter(this, void 0, void 0, function () {
                            var id, path, default_snippet, return_snippet, snippets, snippets_fetched, i;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        id = parseInt(req.params.id);
                                        return [4 /*yield*/, client.query('SELECT * FROM branches WHERE _id = $1', [id])];
                                    case 1:
                                        path = (_a.sent()).rows.pop();
                                        if (!path) {
                                            return [2 /*return*/, res.redirect('/path/0')];
                                        }
                                        default_snippet = { _id: -1, snippet: "Create your action" };
                                        return_snippet = { _id: path.parent_id, snippet: "Go Back!" };
                                        snippets = [default_snippet, default_snippet, default_snippet];
                                        if (path._id != 0)
                                            snippets.push(return_snippet); //only add return snippet if path is not root
                                        return [4 /*yield*/, client.query('SELECT _id,snippet FROM branches WHERE _id IN ($1,$2,$3)', [
                                                path.child_1_id || -1, path.child_2_id || -1, path.child_3_id || -1
                                            ])];
                                    case 2:
                                        snippets_fetched = (_a.sent()).rows;
                                        for (i = 0; i < snippets_fetched.length; i++)
                                            snippets[i] = snippets_fetched[i];
                                        res.render("path", { path: path, snippets: snippets });
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    app.get('/create/:id(\\d+)', checkAuthenticated, function (req, res) {
                        return __awaiter(this, void 0, void 0, function () {
                            var parent_id, parent_path, error;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        parent_id = parseInt(req.params.id);
                                        return [4 /*yield*/, client.query('SELECT * FROM branches WHERE _id = $1', [parent_id])];
                                    case 1:
                                        parent_path = (_a.sent()).rows.pop();
                                        if (!parent_path) {
                                            return [2 /*return*/, res.redirect('/')];
                                        }
                                        error = (function () {
                                            if (putil.NextFreeChild(parent_path) == 0)
                                                return 'There are no more children available!';
                                            return null;
                                        })();
                                        if (error) {
                                            return [2 /*return*/, res.redirect('/path/' + parent_id)];
                                        }
                                        res.render("create", { parent_path: parent_path });
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // non-standalone paths
                    app.get('/guidelines', function (req, res) {
                        res.render('guidelines');
                    });
                    app.post(['/path', '/create'], function (req, res) {
                        var id = req.body.id || '0';
                        if (id.match(/\d+/)) {
                            res.redirect(req.url + '/' + id);
                        }
                        else {
                            res.redirect('/');
                        }
                    });
                    //User Registration
                    app.post('/register', checkNotAuthenticated, function (req, res) {
                        return __awaiter(this, void 0, void 0, function () {
                            var uname, email, rawPwd, error, hashPassword, values, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        uname = req.body.username;
                                        email = req.body.email;
                                        rawPwd = req.body.password;
                                        error = validateReg(email, uname, rawPwd);
                                        if (error != null)
                                            return [2 /*return*/, res.render("register", { error: error })];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, bcrypt.hash(rawPwd, 10)];
                                    case 2:
                                        hashPassword = _a.sent();
                                        values = [uname, email, hashPassword];
                                        return [4 /*yield*/, client.query('INSERT INTO users (username, email, password) VALUES($1,$2,$3);', values)];
                                    case 3:
                                        _a.sent();
                                        res.redirect('/login');
                                        return [3 /*break*/, 5];
                                    case 4:
                                        err_1 = _a.sent();
                                        res.redirect('/register');
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        });
                    });
                    app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
                        successRedirect: '/',
                        failureRedirect: '/login',
                        failureFlash: true
                    }));
                    app.post('/logout', checkAuthenticated, function (req, res, next) {
                        req.logOut(function (err) {
                            if (err)
                                return next(err);
                        });
                        res.redirect('/login');
                    });
                    app.post('/create/:id(\\d+)', checkAuthenticated, function (req, res) {
                        return __awaiter(this, void 0, void 0, function () {
                            function delay(ms) {
                                return new Promise(function (resolve) { return setTimeout(resolve, ms); });
                            }
                            var user, parent_id, parent_path, path, freeChild, error, values, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        user = req.user;
                                        parent_id = parseInt(req.params.id);
                                        return [4 /*yield*/, client.query('SELECT * FROM branches WHERE _id = $1', [parent_id])];
                                    case 1:
                                        parent_path = (_b.sent()).rows.pop();
                                        path = {
                                            _id: -1,
                                            parent_id: parent_id,
                                            creator_id: user.id,
                                            creator_name: user.username,
                                            snippet: req.body.snippet,
                                            body: req.body.body,
                                            tenor_gif: parseInt(req.body.tenor_gif),
                                            time: new Date().getTime()
                                        };
                                        //remove double spaces in string
                                        path.snippet = path.snippet.trim().replace(/\s{2,}/g, ' ');
                                        path.body = path.body.replace(/^[ ]+|[ ]+$/mg, '')
                                            .replace(/[ ]{2,}/g, ' ')
                                            .replace(/[\r\n\t\f\v]+/g, '\\n');
                                        freeChild = putil.NextFreeChild(parent_path);
                                        return [4 /*yield*/, (function () {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    var _a;
                                                    return __generator(this, function (_b) {
                                                        switch (_b.label) {
                                                            case 0:
                                                                if (freeChild == null)
                                                                    return [2 /*return*/, "There are no more children available for parent path id = " + parent_id + "!"];
                                                                if (path.snippet == "" || path.body == "")
                                                                    return [2 /*return*/, "Error: At least one of the fields is empty!"];
                                                                if (path.snippet.length < 5 || path.snippet.length > 40)
                                                                    return [2 /*return*/, "Error: Title length must be between 5 and 40 characters!"];
                                                                if (path.body.length < 80 || path.body.length > 3000)
                                                                    return [2 /*return*/, "Error: Description length must be between 80 and 3000 characters!"];
                                                                _a = path.tenor_gif == NaN;
                                                                if (_a) return [3 /*break*/, 2];
                                                                return [4 /*yield*/, TenorIdsExists([path.tenor_gif + ''])];
                                                            case 1:
                                                                _a = !(_b.sent());
                                                                _b.label = 2;
                                                            case 2:
                                                                if (_a)
                                                                    return [2 /*return*/, "Error: Tenor GIF ID is invalid!"];
                                                                return [2 /*return*/, null];
                                                        }
                                                    });
                                                });
                                            })()];
                                    case 2:
                                        error = _b.sent();
                                        if (error) {
                                            return [2 /*return*/, res.render('create', { parent_path: parent_path, error: error })];
                                        }
                                        values = [path.parent_id, path.creator_id, path.creator_name, path.snippet, path.body, path.tenor_gif, path.time];
                                        _a = path;
                                        return [4 /*yield*/, client.query('INSERT INTO branches (parent_id,creator_id,creator_name,snippet,body,tenor_gif,creation_time_epoch) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING _id', values)];
                                    case 3:
                                        _a._id = (_b.sent()).rows.pop()._id;
                                        return [4 /*yield*/, client.query("UPDATE branches SET " + freeChild + " = $1 WHERE _id = $2", [path._id, parent_id])];
                                    case 4:
                                        _b.sent();
                                        return [4 /*yield*/, delay(1000)];
                                    case 5:
                                        _b.sent();
                                        //inserts new path on database and update parent's child entry
                                        res.redirect('/path/' + path._id);
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    process.on('exit', function (code) {
                        console.log("Shutting down server...");
                        client.release();
                        // db.close();
                        console.log("Database saved!");
                    });
                    //handles ctrl+c
                    process.on("SIGINT", function () {
                        process.exit();
                    });
                    app.listen(port);
                    console.log("Server running on port " + port);
                    return [2 /*return*/];
            }
        });
    });
}
mainApp()["catch"](function (error) {
    console.error(error);
});
;
