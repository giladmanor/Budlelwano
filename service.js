var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var merge = require('merge');
var logic = require('./game_logic');
var Game = require('./Game');
var fs = require('fs');

var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
app.use(bodyParser());
app.use(methodOverride());

/////////////////////////////////////////////////////////////////////////////

var Card = require('./models/card.js');
db = require('./persistence');
db.init(global);

/////////////////////////////////////////////////////////////////////////////
// BOARD// BOARD// BOARD// BOARD// BOARD// BOARD// BOARD// BOARD// BOARD// BOARD
require('./board')(app);
var Board = require('./models/board.js');

/////////////////////////////////////////////////////////////////////////////

app.post('/draw', function(req, res) {
	console.log(req.body.tags);
	var cards = db.getCards(req.body.tags, function(d) {
		res.send(d);
	});
	console.log(cards);
});

app.get('/taginate', function(req, res) {
	Card.find(function(err, cards) {
		if (!err) {
			var tags = [];
			var res = [];
			cards.forEach(function(card) {
				card.tags.forEach(function(tag) {
					if (tags.indexOf(tag.trim()) == -1) {
						tags.push(tag.trim());
						res.push({
							name : tag.trim()
						});
					}
				});
			});
			fs.writeFile(__dirname + '/tags.json', JSON.stringify(res), function(err) {
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
////////////////////////////////////////////////////////////////////////////////////
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

		gameObject = new Game(io, global, code);
		gameObject.register(msg.player);

		if (gameObject.turn === "") {
			gameObject.turn();

			if (msg.tags) {
				gameObject.setTags = msg.tags;
			}
		}

		gameObject.save();
		gameObject.emit();
		
		console.log('---------------------');

		socket.on(code, function(msg) {
			gameObject = new Game(io, global, code);
			console.log(code, ">>> [", gameObject.status, "]", msg);

			if (gameObject.status === "event") {
				if (msg.event == "done") {
					gameObject.event.players.splice(gameObject.event.players.indexOf(msg.player), 1);

					if (gameObject.event.players.length == 0) {
						//end of event
						gameObject.status = "turnover";
						gameObject.turn = gameObject.last_turn;
						gameObject.last_turn = "";

						gameObject.turn = logic.nextTurn(gameObject);
						emit(code, gameObject);

					} else {
					}
					return;
				}
			} else {
				gameObject.players = merge.recursive(true, gameObject.players, msg);
				gameObject = logic.makeEvent(gameObject, msg);
			}

			if (gameObject.status === "event") {
				//we have an event
				var random_index = Math.floor(Math.random() * gameObject.card_ids.length);
				var card_id = gameObject.card_ids[random_index];
				gameObject.card_ids.splice(random_index, 1);
				db.setGameObject(code, gameObject);
				db.getCard(card_id, function(card) {
					gameObject.event.card = card;
					gameObject.event = renderEventTasks(gameObject.event, gameObject.players);
					emit(code, gameObject);
				});
			} else {
				gameObject.turn = logic.nextTurn(gameObject);
				emit(code, gameObject);
			}

		});
	});
});

var renderEventTasks = function(event, players) {
	var participants = event.players;
	var names = [];
	participants.forEach(function(p) {
		names.push(players[p].name ? players[p].name : "jack");
	});

	var card = event.card;

	var rendered_tasks = [];
	participants.forEach(function(player, i) {
		var task = "";
		if (i < card.tasks.length) {
			task = card.tasks[i];
		} else {
			task = card.tasks[card.tasks.length - 1];
		}
		task = task.replace("{all}", names.join());
		task = task.replace("{other}", names[1]);
		task = task.replace("{first}", names[0]);
		task = task.replace("{other+1}", names[(i + 1) % names.length]);
		task = task.replace("{others}", names.splice(1, names.length - 1).join());
		rendered_tasks.push(task);
	});
	card.tasks = rendered_tasks;
	return event;
};

http.listen(4000, function() {
	console.log('listening on *:4000');
});
