var Card = require('./models/card.js');
var Board = require('./models/board.js');
var merge = require('merge');

function Game(io, global, code) {
	this.io = io;
	this.global = global;
	this.code = code;

	if (this.global[code]) {
		this.data = this.global[code];
	} else {
		this.data = {
			round : 0,
			board_id : "",
			turn : "",
			status : "turnover",
			players : {},
			event : {},
			tags : [],
			card_ids : []
		};
	}

	this.setTags = function(tags) {
		Card.find({
			tags : {
				$in : tags
			}
		}, function(err, cards) {
			if (!err) {
				console.log("found", cards.length, "cards");
				cards.forEach(function(card) {
					this.data.card_ids.push(card.id);
				});
				this.save();
			}
		});
	};

	this.save = function() {
		this.global[code] = this.data;
	};

	function communicate(data) {
		return {
			turn : data.turn,
			status : data.status,
			event : data.event
		};
	}


	this.emit = function() {
		console.log(this.code, this.data);
		io.emit(this.code, communicate(this.data));
	};

	this.register = function(msg) {
		this.data.players = merge.recursive(true, this.data.players, msg.player);
		var players = Object.keys(this.data.players);
		var colorArray = ["#DF0101", "#FF8000", "#FFFF00", "#80FF00", "#088A4B", "#00FFFF", "#0080FF", "#4000FF", "#8000FF", "#FF00FF", "#FF0040", "#FFFFFF", "#848484", "#2E2E2E"];
		players.forEach(function(pk, i) {
			this.data.players[pk].color = colorArray[i];
		});
	};

	function getCard(id, finn) {
		Card.findById(id, function(err, card) {
			finn(card);
		});
	}

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

	function populateEvent(event) {

		var random_index = Math.floor(Math.random() * this.data.card_ids.length);
		var card_id = this.data.card_ids[random_index];
		this.data.card_ids.splice(random_index, 1);
		getCard(card_id, function(card) {
			this.data.event.card = card;
			this.data.event = renderEventTasks(event, this.data.players);
			this.emit();
		});

		return event;
	};

	this.makeEvent = function(lastPlayerKey) {

		var loc = lastPlayer[lastPlayerKey].location;
		var players = Object.keys(this.data.players);

		var event = {
			players : []
		};
		this.data.event = event;

		if (this.data.round % players.length == 0 && loc == 0) {
			return flase;
		} else {
			var candidates = [];

			players.forEach(function(pk) {
				if (loc == this.data.players[pk].location) {
					candidates.push(pk);
				}
			});

			if (candidates.length > 1) {
				console.log("-- Casos Beli --");
				this.data.status = "event";
				event.players = candidates;

				this.data.event = populateEvent(event);

				return true;
			} else {
				return false;
			}
		}
	};

	this.accept = function(msg) {
		this.data.players = merge.recursive(true, this.data.players, msg);
		this.data.round = this.data.round + 1;
	};

	this.turn = function() {
		var current = this.data.turn;
		var players = Object.keys(this.data.players);
		console.log("turn " + current + " of " + players.length);

		players.sort();
		var i = players.indexOf(current);
		i = (i + 1) % players.length;
		this.data.turn = players[i];
	};

	this.status = function() {
		return this.data.status;
	};
}

///////////////////////////////////////////////////////////
module.exports = Game;
