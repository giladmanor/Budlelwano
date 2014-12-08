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

/////////////////////////////////////////////////////////////////////////////


var Card = require('./models/card.js');
db = require('./persistence');
db.init(global);


app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

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
			var res=[];
			cards.forEach(function(card) {
				card.tags.forEach(function(tag) {
					if (tags.indexOf(tag.trim()) == -1) {
						tags.push(tag.trim());
						res.push({name:tag.trim()});
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
		gameObject = db.getGameObject(code);
		gameObject.players = merge.recursive(true, gameObject.players, msg.player);
		logic.setPlayerColors(gameObject);
		
		if (gameObject.turn === "") {
			gameObject.turn = logic.nextTurn(gameObject);

			if (msg.tags) {
				gameObject.tags = msg.tags;
				//gameObject.board_id = msg.board_id;
				
				db.getCards(gameObject.tags,function(cards){
					cards.forEach(function(card){
						gameObject.card_ids.push(card.id);
					});
				});
				db.setGameObject(code, gameObject);
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
				var random_index = Math.floor(Math.random()*gameObject.card_ids.length);
				var card_id = gameObject.card_ids[random_index];
				gameObject.card_ids.splice(random_index,1);
				db.setGameObject(code, gameObject);

				db.getCard(card_id, function(card){
					gameObject.event.card = card;
					gameObject.event = renderEventTasks(gameObject.event,gameObject.players);					
					emit(code, gameObject);
				});
			}
		});
	});
});

var renderEventTasks = function(event,players){
	var participants = event.players;
	var names = [];
	participants,forEach(function(p){
		names.push(players[p].name);
	});
	
	var card = event.card;
	var rendered_tasks = [];
	
	participants.forEach(function(player,i){
		var task="";
		if(i<event.taks.length){
			task = card.tasks[i];
		}else{
			task = card.tasks[event.taks.length-1];
		}
		task = task.replace("{all}",names.join());
		task = task.replace("{other}",names[1]);
		task = task.replace("{first}",names[0]);
		task = task.replace("{other+1}",names[(i+1) % names.length]);
		task = task.replace("{others}",names.splice(1,names.length-1).join());
		rendered_tasks.push(task);
	});
	event.tasks = rendered_tasks;
	return event; 
};

http.listen(4000, function() {
	console.log('listening on *:4000');
});
