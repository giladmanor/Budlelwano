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

app.post('/cards', function(req, res) {
	var tags = req.body.tags;
	console.log("cards for tags", tags);
	Card.find({
		tags : {
			$in : tags
		}
	}, function(err, cards) {
		if (err) {
			console.error(err);
			res.send([]);
		}

		console.log("found", cards.length, "cards");
		res.send(cards);
	});

});

app.get('/card/:id', function(req, res) {
	var id = req.params.id;
	Card.findById(id, function(err, card) {
		res.send(card);
	});
});

app.post('/card/set', function(req, res) {

	Card.findById(req.params.id, function(err, card) {

		if (!card) {
			res.statusCode = 404;
			return res.send({
				error : 'Not found'
			});
		}

		if (req.body.tags != null)
			card.tags = req.body.tags;
		if (req.body.equipment != null)
			card.equipment = req.body.equipment;
		if (req.body.tasks != null)
			card.tasks = req.body.tasks;

		return card.save(function(err) {
			if (!err) {
				console.log('Updated');
				return res.send({
					status : 'OK',
					card : card
				});
			} else {
				if (err.name == 'ValidationError') {
					res.statusCode = 400;
					res.send({
						error : 'Validation error'
					});
				} else {
					res.statusCode = 500;
					res.send({
						error : 'Server error'
					});
				}
				console.log('Internal error(%d): %s', res.statusCode, err.message);
			}

			res.send(card);

		});
	});

});

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
				if (gameObject.makeEvent(msg)) {

				} else {
					gameObject.turn = logic.nextTurn(gameObject);
					gameObject.save();
					gameObject.emit();
				}

			}

		});
	});
});

http.listen(4000, function() {
	console.log('listening on *:4000');
});
