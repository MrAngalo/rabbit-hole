console.log('Loading Functions');

var api = require('./server/api/api');
var command = require('./server/api/command');

console.log('Server Initiating');

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) { res.sendFile(__dirname + '/client/user/user.html'); });
app.get('/chat', function(req, res) { res.sendFile(__dirname + '/client/chat/chat.html'); });
app.use('/client', express.static(__dirname + '/client'));

var port = process.env.PORT || 5000;
serv.listen(port);

var connection_id = 1000;
var io = require('socket.io')(serv, { pingInterval: 10000, pingTimeout: 5000 });

console.log('Server Initiated');
console.log("listening on port: " + port);

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var FOOD_LIST = {};

//command.init(api, SOCKET_LIST, PLAYER_LIST, FOOD_LIST)

//////////////////////////////////////
//			PLAYER CLASS			//
//////////////////////////////////////
var Player = function(id, name) {
    this.id = id;
    this.name = name;
	
    this.randomPosition();
	this.updateMass(5);
	
	this.moveRightRequest = false;
    this.moveLeftRequest = false;
    this.moveUpRequest = false;
    this.moveDownRequest = false;
}

Player.prototype.tick = function() {
	this.x += (this.moveRightRequest - this.moveLeftRequest) * this.acceleration;
	this.y += (this.moveUpRequest - this.moveDownRequest) * this.acceleration;
	//if (this.moveRightRequest) {
	//	this.x += this.acceleration;
	//}
	//if (this.moveLeftRequest) {
	//	this.x -= this.acceleration;
	//}
	//if (this.moveUpRequest) {
	//	this.y += this.acceleration;
	//}
	//if (this.moveDownRequest) {
	//	this.y -= this.acceleration;
	//}
}

Player.prototype.randomPosition = function() {
	this.x = Math.getRandomInt(api.GAME_MIN_X + 5, api.GAME_MAX_X - 5);
	this.y = Math.getRandomInt(api.GAME_MIN_Y + 5, api.GAME_MAX_Y - 5);
}

Player.prototype.updateMass = function(mass) {
	this.mass = mass;
	this.radius = 3*Math.sqrt(mass);
	this.acceleration = 3*Math.exp(-0.01*mass) + 3;
}

Player.prototype.eat = function(food) {
	food.respawning = true;
	food.randomPosition();
	
	this.updateMass(this.mass + food.mass);
	
	setTimeout(function() {
		food.respawning = false;
	}, 750);
}

Player.prototype.emit = function(name, data) {
	SOCKET_LIST[this.id].emit(name, data);
}

//////////////////////////////////
//			FOOD CLASS			//
//////////////////////////////////
var Food = function(id) {
	this.id = id;
	
	this.randomPosition();
	this.mass = 2;
	this.radius = 4;
	
	this.respawning = false;
}

Food.prototype.randomPosition = function() {
	this.x = Math.getRandomInt(api.GAME_MIN_X + 5, api.GAME_MAX_X - 5);
	this.y = Math.getRandomInt(api.GAME_MIN_Y + 5, api.GAME_MAX_Y - 5);
}

for (i = 0; i < api.GAME_MAX_FOOD; i++) {
	FOOD_LIST[i] = new Food(i);
}

io.sockets.on('connection', function(socket) {
	
	socket.id = connection_id++;
	SOCKET_LIST[socket.id] = socket;
	console.log('client id-' + socket.id + ' connected to the server');
	
	socket.on('disconnect', function(data) {
		console.log('client id-' + socket.id + ' disconected from the server')
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	});
	
	socket.on('joinRequest', function(data) {
		
		var nameLen = data.name.length;
		if (2 > nameLen || nameLen > 16) {
			socket.emit('joinFailed', { reason: "usernames must be between 2 and 16 characters"});
			return;
		}
		
		var nameRegex = /^[a-zA-Z0-9_!@#$%]+$/;
		if (!nameRegex.test(data.name)) {
			socket.emit('joinFailed', { reason: "usernames must only contain letters, numbers, and !@#$%"});
			return;
		}
		
		var lowerCase = data.name.toLowerCase();
		if (lowerCase.includes("zuhayer") || lowerCase.includes("zoohired") || lowerCase == "zu" || lowerCase == "zoo") {
			socket.emit('joinFailed', { reason: "you are not Zuhayer"});
			return;
		}
		
		var player = new Player(socket.id, data.name);
        PLAYER_LIST[socket.id] = player;
		
		console.log('client id-' + socket.id + ' joined as '+ player.name);
		socket.emit('joinSuccessful', data);
		
	});
		
	socket.on('movementRequest', function(data) {
		var player = PLAYER_LIST[socket.id];
		if (!player) // there is no player
			return;
		
		switch (data.inputId) {
			case 'up':
				player.moveUpRequest = !!data.stats
				break;
			case 'down':
				player.moveDownRequest = !!data.stats
				break;
			case 'left':
				player.moveLeftRequest = !!data.stats
				break;
			case 'right':
				player.moveRightRequest = !!data.stats
				break;
		}
	});
	
	//socket.on('chatMessageSent', function(data) {
	//	var player = PLAYER_LIST[socket.id];
	//	if (!player) // there is no player
	//		return;
	//	
	//	if (data.message.startsWith('/')) {
	//		var cmd = data.message.substr(1).toLowerCase();
	//		
	//		var arguments = cmd.split(' ');
	//		var label = arguments.splice(0, 1)[0];
	//		
	//		if (command.execute(label, arguments, player, socket)) {
	//			console.log(player.name + 'of id-' + socket.id + 'just executed /' + cmd);
	//		}
	//		return;
	//	}
	//	
	//	for (var i in PLAYER_LIST) {
	//		var s = SOCKET_LIST[i];
	//		socket.emit('chatMessageReceived', { sender: player.name, message: data.message });
	//	}
	//});
});

function tick() {
	
    for (var i in PLAYER_LIST) {
		var player = PLAYER_LIST[i];
		player.tick();
	}
	
	/*********************/
	/*calculate collision*/
	/*********************/
	var eattenPlayers = [];
	
	var ids = Object.keys(PLAYER_LIST);
	for (var i = 0; i < ids.length; i++) {
		var player = PLAYER_LIST[ids[i]];
		
		for (var k in FOOD_LIST) {
			var food = FOOD_LIST[k];
			
			var dx = player.x - food.x;
			var dy = player.y - food.y;
			
			var distSqr = dx*dx+dy*dy;
			var radSqr = player.radius * player.radius;
			
			if (!food.respawning && radSqr > distSqr) { //food collision
				player.eat(food);
				player.emit('playerEatsFood', {player: player, food: food});
			}
		}
		
		for (var j = i+1; j < ids.length; j++) {
			
			var player2 = PLAYER_LIST[ids[j]];
			
			var dx = player.x - player2.x;
			var dy = player.y - player2.y;
			var distSqr = dx*dx+dy*dy;
			
			var combRad = player.radius - player2.radius;
			var combRadSqr = combRad*combRad; //always positive
			
			if (combRadSqr > distSqr) { //true if either player is inside another
			
				//the closer the ratio is to 1, the lesser disparity between the player masses
				//player can only eat another if there is enough disparity
				var ratio = player.mass / player2.mass;
				if (ratio >= api.EAT_PLAYER_RATIO) {
					
					eattenPlayers.push(player2);
					var data = {attacker: player, victim: player2};
					player.emit('playerEatsOther', data);
					player2.emit('otherEatsPlayer', data);
					
				} else if (ratio <= api.EAT_PLAYER_RATIO_INV) {
					
					eattenPlayers.push(player);
					var data = {attacker: player2, victim: player};
					player.emit('otherEatsPlayer', data);
					player2.emit('playerEatsOther', data);
				}	
			}
		}
	}
	
	/***********************/
	/*process eaten players*/
	/***********************/
	for (var i = 0; i < eattenPlayers.length; i++) {
		var player = eattenPlayers[i];
		delete PLAYER_LIST[player.id];
	}
}

function render() {
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('render', { PLAYER_LIST: PLAYER_LIST, FOOD_LIST: FOOD_LIST });
    }
}

setInterval(function() {
    tick();
    render();
}, 1000 / 30);