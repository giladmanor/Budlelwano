var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var merge = require('merge');

var calculateNextTurn = function(gameObject) {
	var current = gameObject["turn"];
	var players = Object.keys(gameObject.players);
	console.log("turn " + current + " of " + players.length);

	players.sort();
	var i = players.indexOf(current);
	i = (i + 1) % players.length;
	return players[i];
};

var calculateEvent = function(gameObject, lastPlayer) {
	var lastPlayerKey = Object.keys(lastPlayer)[0];
	var loc = lastPlayer[lastPlayerKey].location;
	var players = Object.keys(gameObject.players);
	var event = {
		players : []
	};
	var candidates = [];
	var locsum = 0;
	players.forEach(function(pk) {
		locsum += gameObject.players[pk].location;
	});

	if (locsum > 0) {
		players.forEach(function(pk) {
			if (loc == gameObject.players[pk].location) {
				candidates.push(pk);
			}
		});
		if (candidates.length > 1) {
			console.log("-- Casos Beli --");
			event.players = candidates;
		}
	}

	return event;
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
		global[code] = global[code] || {
			turn : "",
			players : {},
			event : {},
			tags:[]
		};
		socket.on(code, function(msg) {
			console.log(msg);
			
			if(msg.event == "tags"){
				global[code].tags = msg.tags; 
			}else if (msg.event == "done") {
				global[code].event.players.splice(global[code].event.players.indexOf(msg.player), 1);
			} else {
				global[code].players = merge.recursive(true, global[code].players, msg);
				global[code].event = calculateEvent(global[code], msg);
			}

			if (global[code].event.players.length == 0) {
				if(global[code].turn === ""){
					global[code].turn = global[code].last_turn;
					global[code].last_turn="";
				}
				global[code].turn = calculateNextTurn(global[code]);
			} else {
				global[code].last_turn = global[code].turn;
				global[code].turn = "";
			}

			console.log(code, global[code]);
			io.emit(code, global[code]);
		});
		io.emit(code, global[code]);
	});

});

http.listen(4000, function() {
	console.log('listening on *:4000');
});
