module.exports = {
	setPlayerColors:function(gameObject){
		console.log("colors");
		var players = Object.keys(gameObject.players);
		var colorArray=["#DF0101","#FF8000","#FFFF00","#80FF00","#088A4B","#00FFFF","#0080FF","#4000FF","#8000FF","#FF00FF","#FF0040","#FFFFFF","#848484","#2E2E2E"];
		players.forEach(function(pk,i) {
			gameObject.players[pk].color =  colorArray[i];
		});
	},
	switchBoard:function(gameObject,success){
		var Board = require('./models/board.js');
		
		Board.find(function(err, items) {
			if (!err) {
				var val = Math.floor((Math.random() * items.length));
				success(items[val]);
			} else {
				console.log('Internal error(%d): %s', res.statusCode, err.message);
			}
		});
	},
	nextTurn : function(gameObject) {
		var current = gameObject["turn"];
		var players = Object.keys(gameObject.players);
		console.log("turn " + current + " of " + players.length);

		players.sort();
		var i = players.indexOf(current);
		i = (i + 1) % players.length;
		return players[i];
	},
	makeEvent : function(gameObject, lastPlayer) {
		
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
				gameObject.status = "event";
				event.players = candidates;
			}
		}
		gameObject.event = event;

		return gameObject;
	}
};
