var Board = require('./models/board.js');

module.exports = function(app) {
	findAll = function(req, res) {
		console.log("All");
		return Board.find(function(err, items) {
			if (!err) {
				return res.send(items);
			} else {
				res.statusCode = 500;
				console.log('Internal error(%d): %s', res.statusCode, err.message);
				return res.send({
					error : 'Server error'
				});
			}
		});
	};
	find = function(req, res) {
		console.log("By :id");
		return Board.findById(req.params.id, function(err, item) {
			if (!item) {
				res.statusCode = 404;
				return res.send({
					error : 'Not found'
				});
			}
			if (!err) {
				return res.send(item);
			} else {
				res.statusCode = 500;
				console.log('Internal error(%d): %s', res.statusCode, err.message);
				return res.send({
					error : 'Server error'
				});
			}
		});
	};
	load = function(req, res) {
		var fs = require('fs');
		var readline = require('readline');

		var rd = readline.createInterface({
			input : fs.createReadStream('./boards.tsv'),
			output : process.stdout,
			terminal : false
		});

		rd.on('line', function(line) {
			var row = line.split("\t");
			var tags = row[0].split(",");
			var name = row[1];
			var thumb = row[2];
			var data = JSON.parse(row[3]);

			var board = new Board({
				tags : tags,
				name : name,
				thumb : thumb,
				data : data
			});

			board.save(function(err) {
				if (err) {
					console.log('Error while saving : ' + err);
				} else {
					console.log("board created");
				}
			});
		});
	};

	app.get('/board/load', load);
	app.get('/boards', findAll);
	app.get('/board/:id', find);
};
