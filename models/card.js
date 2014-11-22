var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Card = new Schema({
	tags : [String],
	equipment : [String],
	tasks:[Schema.Types.Mixed],
	
});

module.exports = mongoose.model('Card', Card); 