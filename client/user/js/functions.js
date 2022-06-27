var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var WIDTH = 0
var HEIGHT = 0
var MIN_WIDTH = 720;
var MIN_HEIGHT = 480;

const GAME_WIDTH = 720;
const GAME_HEIGHT = 480;

const GAME_MIN_X =-GAME_WIDTH / 2;
const GAME_MAX_X = GAME_WIDTH / 2;
const GAME_MIN_Y =-GAME_HEIGHT / 2;
const GAME_MAX_Y = GAME_HEIGHT / 2;

var GAME_SCALE = 0;

//------------//
var Camera = function(x, y) {
	this.x = x;
	this.y = y;
}
//------------//

Camera.prototype.project = function(x, y) {
	return {
		x: canvas.width * (x - GAME_MIN_X) / GAME_WIDTH - this.x,
		y: canvas.height * (1 - (y - GAME_MIN_Y) / GAME_HEIGHT) - this.y
	};
}

function updateCanvasDimentions() {

	HEIGHT = Math.max(window.innerHeight - 5, MIN_HEIGHT);
	WIDTH = Math.max(window.innerWidth - 5, MIN_WIDTH);

	var scaleH = HEIGHT / GAME_HEIGHT;
	var scaleW = WIDTH / GAME_WIDTH;

	if (scaleW < scaleH) {
		GAME_SCALE = scaleW;
		canvas.width = WIDTH
		canvas.height = GAME_HEIGHT * scaleW
	} else {
		GAME_SCALE = scaleH;
		canvas.width = GAME_WIDTH * scaleH
		canvas.height = HEIGHT
	}
	
	canvas.style.marginTop = ((HEIGHT - canvas.height) / 2) + 'px'
	ctx.font = (Math.floor(GAME_SCALE * 10)) + 'px Arial';
}

function requestChatWindow() {
	if (window.chatWindow == null || window.chatWindow.closed) {
		window.chatWindow = window.open('chat', 'Whats10x10 Chat', 'width=400px,height=300px,resizable=0,titlebar=1')
		window.chatWindow.gameWindow = window;
		window.addEventListener("beforeunload", function() {
            window.chatWindow.close();
        });
	} else {
		window.chatWindow.focus();
	}
}