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

	

	this.makeEvent = function() {
		
		
		var lastPlayerKey = Object.keys(lastPlayer)[0];
		var loc = lastPlayer[lastPlayerKey].location;
		var players = Object.keys(gameObject.players);
		
		if (this.data.round % players.length == 0){}
		
		
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
				gameObject.status = "event";
				event.players = candidates;
			}
		}
		gameObject.event = event;

		return gameObject;
	};
	
	this.accept = function(msg) {
		this.data.players = merge.recursive(true, this.data.players, msg);
		this.data.round = this.data.round +1; 
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

function getCard(id, finn) {
	Card.findById(id, function(err, card) {
		finn(card);
	});
}

///////////////////////////////////////////////////////////
module.exports = Game;
