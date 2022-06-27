var command = {}

command.init = function(api, SOCKET_LIST, PLAYER_LIST, FOOD_LIST) {
	
	command.commands = {};

	command.message = function(socket, message) {
		socket.emit('chatMessageReceived', {
			sender: 'Server',
			message: message,
		});
	}

	command.add = function(label, attributes, run) {
		command.commands[label] = {
			run: run,
			attributes: attributes
		}
	}

	command.execute = function(label, args, sender, socket) {
		if (command.commands[label] != null && (sender.permission || !command.commands[label].attributes.permission)) {
			command.message(socket, '- - - - - - - - - -');
			command.commands[label].run(args, sender, socket);
			return true;
		} else {
			return false;
		}
	}

	//Commands

	/* Template

		command.add('PLACEHOLDER', {
			description: 'executes PLACEHOLDER!',
			permission: false,
			usage: '/PLACEHOLDER <arg1> <arg2>'
		}, function(args, sender, socket) {
			//command goes here
		});

	*/
	
	//HELP
	
	command.add('help', {
		usage: '/help <command>',
		description: 'shows all avaliable commands!',
		permission: false,
	}, function(args, sender, socket) {
		var lines = [];
		
		if (!String.isEmpty(args[0])) {
			var label = args[0];
			
			if (command.commands[label] == null) {
				command.message(socket, 'the command /' + label + ' does not exist!');
				return;
			}
			var attributes = command.commands[label].attributes;
			
			lines.push('key: () keyword');
			lines.push('key: <> optional');
			lines.push('key: [] mandatory');
			lines.push('key: |  or');
			lines.push('showing details of /' + label + ':');
			lines.push('usage: ' + attributes.usage);
			lines.push('description: ' + attributes.description);
			lines.push('requires permission: ' + attributes.permission);
		} else {		
			var index = 1;
			
			lines.push('showing all avaliable commands:');
			
			for (var label in command.commands) {
				lines.push(index + ' /' + label);
				index++;
			}
			lines.push('for more details use /help <command>');
		}
		command.message(socket, lines.join('\n'));
	});
	
	//GAME
	
	command.add('game', {
		description: 'displays game info!',
		permission: false,
		usage: '/game (id|food|dimensions)'
	}, function(args, sender, socket) {
		var lines = [];
		
		if (!String.isEmpty(args[0])) {
			switch (args[0]) {
			case "id":
			lines.push('displaying relationship between ids, mass and player names:');
				for (var i in PLAYER_LIST) {
					var player = PLAYER_LIST[i];
					lines.push('id: ' + i + ' mass: ' + player.mass + ' name: ' + player.name);
				}
				break;
			case "food":
				lines.push('there is currently ' + api.GAME_MAX_FOOD + ' food item(s) within the game!');
				break;
			case "dimensions":
				lines.push('game width: ' + api.GAME_WIDTH + ' and height: ' + api.GAME_HEIGHT + '!');
				break;
			default:
				lines.push('unknown keyword: ' + args[0] + '!');
				break;
			}
		} else {
			lines.push('you must enter a keyword! /help game');
		}
		command.message(socket, lines.join('\n'));
	});
	
	//COORDINATE
	
	command.add('coordinate', {
		description: 'displays current coordinates!',
		permission: false,
		usage: '/coordinate'
	}, function(args, sender, socket) {
		var lines = [];
		lines.push('your coordinate:')
		lines.push('x: ' + sender.x + ' y: ' + sender.y);
		command.message(socket, lines.join('\n'));
	});
	
	//STATS
	
	command.add('stats', {
		description: 'displays player stats!',
		permission: false,
		usage: '/stats <id>'
	}, function(args, sender, socket) {
		var lines = [];
		var player = sender;
		
		if (!String.isEmpty(args[0])) {
			var id = args[0];
			
			if (PLAYER_LIST[id] == null) {
				command.message(socket, 'player with id-' + id + ' is not online');
				return;
			}
			player = PLAYER_LIST[id];
		}
		lines.push('displaying stats of ' + player.name + '! (id-' + player.id + ')');
		lines.push('mass: ' + player.mass);
		lines.push('acceleration: ' + player.acceleration);
		lines.push('has permission: ' + player.permission);
		
		command.message(socket, lines.join('\n'));
	});
}

module.exports = command;