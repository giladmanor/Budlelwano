module.exports = {
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
				event.players = candidates;
			}
		}

		return event;
	}
};
