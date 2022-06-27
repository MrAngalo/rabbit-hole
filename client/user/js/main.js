window.addEventListener('load', function(event) {
	
	var socket = io();
	document.socket = socket;
	
	var camera = new Camera(0, 0, 0);

	var joinWrapper = document.getElementById("join_wrapper");
	var joinNameInput = document.getElementById("join_nameInput");
	var joinButton = document.getElementById("join_button");
	var joinConnection = document.getElementById("join_connection");
	
	window.addEventListener("resize", updateCanvasDimentions);
	updateCanvasDimentions();

	function joinRequest() {
		var name = joinNameInput.value.substring(0, 15); //limits name to 15 characters 
		socket.emit('joinRequest', { name: name }); 
	}
	
	joinNameInput.addEventListener('keyup', function(event) { if (event.keyCode == 13) joinRequest(); });
	joinButton.addEventListener("click", joinRequest);
	
	function movementRequest(event, stats) {
		switch (event.key) {
		case "ArrowUp":
		case "w":
			socket.emit('movementRequest', { inputId: 'up', stats: stats });
			break;
		case "ArrowDown":
		case "s":
			socket.emit('movementRequest', { inputId: 'down', stats: stats });
			break;
		case "ArrowLeft":
		case "a":
			socket.emit('movementRequest', { inputId: 'left', stats: stats });
			break;
		case "ArrowRight":
		case "d":
			socket.emit('movementRequest', { inputId: 'right', stats: stats });
			break;
		}
	}
	
	document.addEventListener('keydown', function(event) { movementRequest(event, true); });
	document.addEventListener('keyup', function(event) { movementRequest(event, false); });
	//document.addEventListener('keyup', function(event) { if (event.key == 'c') requestChatWindow(); });
	
	socket.on('connect', function() {
		joinWrapper.style.visibility = "visible";
		joinConnection.innerHTML = "Connected!";
	});

	socket.on('disconnect', function() {
		joinWrapper.style.visibility = "visible";
		joinConnection.innerHTML = "Connecting...";
	});

	socket.on('joinFailed', function(data) {
		alert("Failed to join: "+data.reason);
	});

	socket.on('joinSuccessful', function(data) {
		joinWrapper.style.visibility = "hidden";
		document.name = data.name;
	});
	
	//triggered when the player eats food
	//socket.on('playerEatsFood', function(data) {});
	
	//triggered when the player eats another player
	//socket.on('playerEatsOther', function(data) {});
	
	//triggered when another player eats player
	socket.on('otherEatsPlayer', function(data) {
		joinWrapper.style.visibility = "visible";
		joinConnection.innerHTML = "You Died!";
	});

	//wait the server to send data to render
	socket.on('render', function(data) {
		
		//repaint the canvas white so no frames overlap
		ctx.fillStyle = "white";
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		/**********************/
		/*calculate projection*/
		/**********************/
		
		for (var i in data.PLAYER_LIST) {
			var player = data.PLAYER_LIST[i];
			player.projPos = camera.project(player.x, player.y);
			player.projRad = player.radius * GAME_SCALE;
		}
		
		for (var k in data.FOOD_LIST) {
			var food = data.FOOD_LIST[k];
			food.projPos = camera.project(food.x, food.y);
			food.projRad = food.radius * GAME_SCALE;
		}
		
		/***********/
		/*rendering*/
		/***********/
		
		for (var k in data.FOOD_LIST) {
			var food = data.FOOD_LIST[k];
		
			ctx.fillStyle = "blue";
			ctx.lineWidth = GAME_SCALE * 2;
			ctx.beginPath();
			ctx.arc(food.projPos.x, food.projPos.y, food.projRad, 0, 2 * Math.PI);
			ctx.fill();
			ctx.lineWidth = 1;
		}
		
		for (var i in data.PLAYER_LIST) {
			var player1 = data.PLAYER_LIST[i];
			
			//draws player's body
			ctx.fillStyle = "white";
			ctx.beginPath();
			ctx.arc(player1.projPos.x, player1.projPos.y, player1.projRad, 0, 2 * Math.PI);
			ctx.fill();
			ctx.lineWidth = 1;
			
			ctx.strokeStyle = "black";
			ctx.lineWidth = GAME_SCALE * 2;
			ctx.beginPath();
			ctx.arc(player1.projPos.x, player1.projPos.y, player1.projRad, 0, 2 * Math.PI);
			ctx.stroke();
			
			ctx.fillStyle = "black";
			//draws player's name
			var text_x = player1.projPos.x - (ctx.measureText(player1.name).width / 2);
			var text_y = player1.projPos.y + (player1.projRad + parseInt(ctx.font.split('px')[0]) * 1.15);
			ctx.fillText(player1.name, text_x, text_y);
		}
		
		ctx.fillStyle = "black";
		
	});
});

/*

www.whats10.x10.bz
created by Guilherme S.

*/