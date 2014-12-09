var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Board = new Schema({
	tags : [String],
	name : String,
	thumb: String,
	data:[],
	
});

module.exports = mongoose.model('Board', Board); 