function Objective(d) {
	this.data = d;

	var log = function(d) {
		console.log(d);
	};

	this.plot = function() {
		log(this.data);
	};

};

module.exports = Objective;
