
module.exports = {
	global:{},
	init:function(global){
		this.global = global;
	},
	getGameObject:function(code){
		console.log(global[code]);
		return this.global[code] || {
			turn : "",
			players : {},
			event : {},
			tags : []
		};
	},
	setGameObject:function(code,gameObject) {
		this.global[code] = gameObject;
	}
};

