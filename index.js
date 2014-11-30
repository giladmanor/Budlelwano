var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var merge = require('merge');
var logic = require('./game_logic');
var fs = require('fs');

var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
app.use(bodyParser());
app.use(methodOverride());

var Card = require('./models/card.js');
db = require('./persistence');
db.init(global);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/draw', function(req, res) {
	console.log(req.body.tags);
	var cards = db.getCard(req.body.tags, function(d) {
		res.send(d);
	});
	console.log(cards);

});

app.get('/taginate', function(req, res) {
	Card.find(function(err, cards) {
		if (!err) {
			var tags = [];
			cards.forEach(function(card) {
				card.tags.forEach(function(tag) {
					if (tags.indexOf(tag.trim()) == -1) {
						tags.push(tag.trim());
					}
				});
			});
			fs.writeFile(__dirname + '/tags.json', JSON.stringify(tags), function(err) {
				console.log(err);
			});
		}
	});

	res.send({
		"result" : "OK"
	});

});

app.get('/tags', function(req, res) {
	res.sendFile(__dirname + '/tags.json');

});

// MongoDB configuration
mongoose.connect('mongodb://localhost/card', function(err, res) {
	if (err) {
		console.log('error connecting to MongoDB Database. ' + err);
	} else {
		console.log('Connected to Database');
	}
});

var emit = function(code, gameObject) {
	console.log(code, gameObject);
	db.setGameObject(code, gameObject);
	io.emit(code, gameObject);
};

/////////////////////////////////////////////////////////////////////////

io.on('connection', function(socket) {
	console.log('a user connected');
	socket.on('chat message', function(msg) {
		console.log('message: ' + msg);
		io.emit('chat message', msg);
	});
	socket.on('disconnect', function(u) {
		console.log('user disconnected', u);
	});

	socket.on('register', function(msg) {
		var code = msg.code;
		console.log('register: ', code);
		gameObject = db.getGameObject(code);
		gameObject.players = merge.recursive(true, gameObject.players, msg.player);
		logic.setPlayerColors(gameObject);
		if (gameObject.turn === "") {
			gameObject.turn = logic.nextTurn(gameObject);

			if (msg.tags) {
				gameObject.tags = msg.tags;
				gameObject.board_id = msg.board_id;
			}
		}

		db.setGameObject(code, gameObject);
		io.emit(code, gameObject);
		console.log(code, gameObject);
		console.log('---------------------');

		socket.on(code, function(msg) {
			console.log(code, ">>>", msg);
			gameObject = db.getGameObject(code);

			if (msg.event == "init") {
				gameObject.tags = msg.tags;
				gameObject.board_id = msg.board_id;
			} else if (msg.event == "done") {
				gameObject.event.players.splice(gameObject.event.players.indexOf(msg.player), 1);
			} else {
				gameObject.players = merge.recursive(true, gameObject.players, msg);
				gameObject.event = logic.makeEvent(gameObject, msg);
				//calculateEvent(global[code], msg);
			}

			if (gameObject.event.players.length == 0) {
				if (gameObject.turn === "") {
					gameObject.turn = gameObject.last_turn;
					gameObject.last_turn = "";
				}
				gameObject.turn = logic.nextTurn(gameObject);
				emit(code, gameObject);
			} else {
				//we have an event
				gameObject.last_turn = gameObject.turn;
				gameObject.turn = "";

				db.getCard(req.body.tags, function(d){
					var card = d[0];
					
					gameObject.event.card = card;
					emit(code, gameObject);
				});

			}

		});

	});

});

http.listen(4000, function() {
	console.log('listening on *:4000');
});
