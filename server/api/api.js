var api = {}

api.GAME_WIDTH = 720;
api.GAME_HEIGHT = 480;
api.GAME_MAX_FOOD = 100;

api.GAME_MIN_X = -api.GAME_WIDTH / 2;
api.GAME_MAX_X = api.GAME_WIDTH / 2;
api.GAME_MIN_Y = -api.GAME_HEIGHT / 2;
api.GAME_MAX_Y = api.GAME_HEIGHT / 2;

api.EAT_PLAYER_RATIO = 1.25;
api.EAT_PLAYER_RATIO_INV = 1/api.EAT_PLAYER_RATIO;

module.exports = api;

Math.getRandomInt = function(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

String.prototype.equalsIgnoreCase = function(string) {
	return this.toUpperCase() === string.toUpperCase();
}

String.constructor.__proto__.isEmpty = function(string){
  return (string == null || string === "");
}