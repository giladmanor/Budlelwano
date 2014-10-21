var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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
		socket.on(code, function(msg) {
			console.log(code, msg);
			io.emit(code, msg);
		});
		io.emit(code, "Welcome!");
	});

});

http.listen(4000, function() {
	console.log('listening on *:4000');
}); 