var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Card = new Schema({
	tags : [String],
	equipment : [String],
	review:String,
	tasks:[String],
	
});

module.exports = mongoose.model('Card', Card); 