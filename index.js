var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var merge = require('merge');
var logic = require('./game_logic');
db = require('./persistence');
db.init(global);

var card = require('./card');

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/card/', card.get_form);
app.get('/card/:id', card.get_card);
app.post('/card/', card.set_form);

app.get('/card/:id', function (req, res) {
  console.log('Get Card by ID',req.params);
  res.send(req.params.id);
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

	socket.on('register', function(msg) {
		var code = msg.code;
		console.log('register: ', code);
		gameObject = db.getGameObject(code);
		gameObject.players = merge.recursive(true, gameObject.players, msg.player);
		logic.setPlayerColors(gameObject);
		if(gameObject.turn===""){
			gameObject.turn = logic.nextTurn(gameObject);
		}
		
		db.setGameObject(code,gameObject);
		io.emit(code, gameObject);
		console.log(code,gameObject);
		console.log('---------------------');
		
		socket.on(code, function(msg) {
			console.log(code,">>>",msg);
			gameObject = db.getGameObject(code);

			if (msg.event == "init") {
				gameObject.tags = msg.tags;
				gameObject.board_id = msg.board_id;
			} else if (msg.event == "done") {
				gameObject.event.players.splice(gameObject.event.players.indexOf(msg.player), 1);
			}  else {
				gameObject.players = merge.recursive(true, gameObject.players, msg);
				gameObject.event = logic.makeEvent(gameObject, msg);//calculateEvent(global[code], msg);
			}

			if (gameObject.event.players.length == 0) {
				if (gameObject.turn === "") {
					gameObject.turn = gameObject.last_turn;
					gameObject.last_turn = "";
				}
				gameObject.turn = logic.nextTurn(gameObject);//calculateNextTurn(global[code]);
			} else {
				gameObject.last_turn = gameObject.turn;
				gameObject.turn = "";
			}

			console.log(code, gameObject);
			db.setGameObject(code,gameObject);
			io.emit(code, gameObject);
		});
		
	});

});

http.listen(4000, function() {
	console.log('listening on *:4000');
});
