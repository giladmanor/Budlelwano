var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameObject = new Schema({
	code: String,
	data : String
	
});

module.exports = mongoose.model('GameObject', GameObject); 