var Card = require('./models/card.js');

module.exports = {
	global:{},
	init:function(global){
		this.global = global;
	},
	getGameObject:function(code){
		
		return this.global[code] || {
			turn : "",
			status : "turnover",
			players : {},
			event : {},
			tags : [],
			card_ids : []
		};
	},
	setGameObject:function(code,gameObject) {
		this.global[code] = gameObject;
	},
	getCards:function(tags,finn){
		console.log("cards for tags",tags);
		Card.find({ tags: { $in: tags }},function(err,cards){
			if(err){
				console.error(err);
				finn([]);
			}
			
			console.log("found",cards.length,"cards");
			finn(cards);
		});
	},
	getCard:function(id,finn){
		Card.findById(id, function(err, card) {
			finn(card);
		});
	}
};

