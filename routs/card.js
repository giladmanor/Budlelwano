var Card = require('../models/card.js');

module.exports = function(app) {

	/**
	 * Find and retrieves all tshirts
	 * @param {Object} req HTTP request object.
	 * @param {Object} res HTTP response object.
	 */
	findAllCards = function(req, res) {
		console.log("GET - /cards");
		return Card.find(function(err, cards) {
			if (!err) {
				return res.send(cards);
			} else {
				res.statusCode = 500;
				console.log('Internal error(%d): %s', res.statusCode, err.message);
				return res.send({
					error : 'Server error'
				});
			}
		});
	};

	/**
	 * Find and retrieves a single tshirt by its ID
	 * @param {Object} req HTTP request object.
	 * @param {Object} res HTTP response object.
	 */
	findById = function(req, res) {
		console.log("GET - /card/:id");
		return Card.findById(req.params.id, function(err, card) {
			if (!card) {
				res.statusCode = 404;
				return res.send({
					error : 'Not found'
				});
			}

			if (!err) {
				return res.send({
					status : 'OK',
					card : card
				});
			} else {
				res.statusCode = 500;
				console.log('Internal error(%d): %s', res.statusCode, err.message);
				return res.send({
					error : 'Server error'
				});
			}
		});
	};

	/**
	 * Creates a new tshirt from the data request
	 * @param {Object} req HTTP request object.
	 * @param {Object} res HTTP response object.
	 */
	addCard = function(req, res) {
		console.log('POST - /card');
		console.log(req.body);
		var card = new Card({
			tags : req.body.tags,
			equipment : req.body.equipment,
			tasks : req.body.tasks
		});

		card.save(function(err) {
			if (err) {
				console.log('Error while saving tshirt: ' + err);
				res.send({
					error : err
				});
				return;
			} else {
				console.log("Card created");
				return res.send({
					status : 'OK',
					card : card
				});
			}
		});
	};

	/**
	 * Update a tshirt by its ID
	 * @param {Object} req HTTP request object.
	 * @param {Object} res HTTP response object.
	 */
	updateCard = function(req, res) {

		console.log("PUT - /card/:id");
		return Card.findById(req.params.id, function(err, card) {

			if (!card) {
				res.statusCode = 404;
				return res.send({
					error : 'Not found'
				});
			}

			if (req.body.tags != null)
				card.tags = req.body.tags;
			if (req.body.equipment != null)
				card.equipment = req.body.equipment;
			if (req.body.tasks != null)
				card.tasks = req.body.tasks;
			

			return card.save(function(err) {
				if (!err) {
					console.log('Updated');
					return res.send({
						status : 'OK',
						card : card
					});
				} else {
					if (err.name == 'ValidationError') {
						res.statusCode = 400;
						res.send({
							error : 'Validation error'
						});
					} else {
						res.statusCode = 500;
						res.send({
							error : 'Server error'
						});
					}
					console.log('Internal error(%d): %s', res.statusCode, err.message);
				}

				res.send(card);

			});
		});
	};

	/**
	 * Delete a tshirt by its ID
	 * @param {Object} req HTTP request object.
	 * @param {Object} res HTTP response object.
	 */
	deleteCard = function(req, res) {
		console.log("DELETE - /card/:id");
		return Card.findById(req.params.id, function(err, card) {
			if (!card) {
				res.statusCode = 404;
				return res.send({
					error : 'Not found'
				});
			}

			return card.remove(function(err) {
				if (!err) {
					console.log('Removed tshirt');
					return res.send({
						status : 'OK'
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
	};
	
	deleteAllCards = function(req, res) {
		console.log("DELETE - /card/:id");
		return Card.find(function(err, cards) {
			if (!err) {
				cards.forEach(function(card){
					card.remove();
				});
				
				return res.send({ok:true});
			} else {
				res.statusCode = 500;
				console.log('Internal error(%d): %s', res.statusCode, err.message);
				return res.send({
					error : 'Server error'
				});
			}
	};
	
	
	//Link routes and actions
	app.get('/card', findAllCards);
	app.get('/card/:id', findById);
	app.post('/card', addCard);
	app.put('/card/:id', updateCard);
	app.delete('/card/:id', deleteCard);
	app.delete('/card/all', deleteAllCards);

}; 