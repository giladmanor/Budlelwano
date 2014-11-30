var Card = require('./models/card.js');

module.exports = {
	global:{},
	init:function(global){
		this.global = global;
	},
	getGameObject:function(code){
		
		return this.global[code] || {
			turn : "",
			players : {},
			event : {},
			tags : [],
			card_ids : []
		};
	},
	setGameObject:function(code,gameObject) {
		this.global[code] = gameObject;
	},
	getCard:function(tags,finn){
		Card.find({ tags: { $in: tags }},function(err,cards){
			finn(cards);
		});
	},
};

