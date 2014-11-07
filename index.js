var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var merge = require('merge');

var calculateNextTurn = function(gameObject){
	var current = gameObject["turn"];
	var players = Object.keys(gameObject);
	console.log("turn "+ current+" of "+ players.length);
	players.splice(players.indexOf("turn"), 1);
	players.sort();
	var i = players.indexOf(current);
	i = (i+1)%players.length;
	return players[i];
};

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('a user connected');
	socket.on('chat message', function(msg) {
		console.log('message: ' + msg);
		io.emit('chat message', msg);
	});
	socket.on('disconnect', function(u) {
		console.log('user disconnected', u);
	});

	socket.on('register', function(code) {
		console.log('register: ', code);
		global[code] = global[code] || {turn:""};
		socket.on(code, function(msg) {
			console.log(msg);
			global[code] = merge.recursive(true, global[code], msg);
			console.log(code, global[code]);
			global[code]["turn"] = calculateNextTurn(global[code]);
			console.log(code, global[code]);
			io.emit(code, global[code]);
		});
		io.emit(code, global[code]);
	});

});

http.listen(4000, function() {
	console.log('listening on *:4000');
}); 