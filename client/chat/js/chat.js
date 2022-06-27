var chat_container = document.getElementById('chat_container');
var chat_button = document.getElementById('chat_button');
var chat_input = document.getElementById('chat_input');
var chat_output = document.getElementById('chat_output');

function init() {
	
	var username = gameWindow.document.name;
	
	function resizeChat() {
		chat_container.style.width = (window.innerWidth -10) + 'px';
		chat_container.style.height = (window.innerHeight -10) + 'px';
	}
	
	window.addEventListener("resize", resizeChat);
	resizeChat();
	
	function sendMessage() {
		if (chat_input.value != "") {
			gameWindow.socket.emit('chatMessageSent', {
				message: chat_input.value
			});
			
			chat_input.value = "";
		}
	}
	
	chat_button.addEventListener("click", sendMessage);
	chat_input.addEventListener('keyup', function(e) {
		if (event.keyCode === 13) {
			sendMessage();
		}
	});
	
	function log(sender, message) {
		chat_output.value += sender + ': ' + message + '\n';
		chat_output.scrollTop = chat_output.scrollHeight;
	}
	
	log('Server', 'Welcome ' + username + ' to the chat area!');
	
	gameWindow.socket.on('chatMessageReceived', function(data) {
		data.message.split('\n').forEach(function(message){
			log(data.sender, message);
		});
	})
	
	document.title = 'Chat of ' + username;
}

window.addEventListener("load", function(e) {
	if (window.gameWindow != null && window.gameWindow != window) {
		init();
	} else {				
		
		
		
	}
});