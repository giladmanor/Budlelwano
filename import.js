var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require("mongoose");
var app = express();

var fs = require('fs');
var readline = require('readline');

var Card = require('./models/card.js');
app.use(express.static(__dirname + '/public'));
// set the static files location
app.use(morgan('dev'));
// log every request to the console
app.use(bodyParser());
// pull information from html in POST
app.use(methodOverride());
// simulate DELETE and PUT

// MongoDB configuration
mongoose.connect('mongodb://localhost/card', function(err, res) {
	if (err) {
		console.log('error connecting to MongoDB Database. ' + err);
	} else {
		console.log('Connected to Database');
	}
});

app.listen(8080);
console.log('Magic happens on port 8080');
// shoutout to the user

// First example router
app.get('/purge', function(req, res) {
	Card.find(function(err, cards) {
		if (!err) {
			cards.forEach(function(card) {
				card.remove();
			});

			return res.send({
				ok : true
			});
		} else {
			res.statusCode = 500;
			console.log('Internal error(%d): %s', res.statusCode, err.message);
			return res.send({
				error : 'Server error'
			});
		}
	});
});

app.get('/import/:file_name', function(req, res) {

	var rd = readline.createInterface({
		input : fs.createReadStream('./' + req.params.file_name),
		output : process.stdout,
		terminal : false
	});

	rd.on('line', function(line) {
		console.log("--------------------------------");
		var row = line.split("\t");
		var tags = row[0].split(",");
		var equip = row[1].split(",");

		var l = row.length;
		var tasks = row.slice(2, l - 1);

		var card = new Card({
			tags : tags,
			equipment : equip,
			tasks : tasks
		});

		card.save(function(err) {
			if (err) {
				console.log('Error while saving tshirt: ' + err);
			} else {
				console.log("Card created");
			}
		});
	});

	res.send({
		ok : true
	});
});
