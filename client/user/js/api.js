CanvasRenderingContext2D.prototype.fillLineBreakText = function(string, x, y, splitchar, spacement) {
	var fontSize = parseInt(this.font.split('px')[0]);
	y += fontSize 
	
	var array = string.split(splitchar);
	
	for (var i = 0; i < array.length; i++) {
		this.fillText(array[i], x, y);
		y += fontSize + spacement;
	}
}

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)]
}