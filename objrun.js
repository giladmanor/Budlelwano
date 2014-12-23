var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Objective = require('./objective');

app.get('/me', function(req, res) {
	var o = new Objective({a:"b"});
	o.plot();
	console.log("-----");
	console.log(o.data);
	
	
	res.send({
		"result" : "OK"
	});
});

http.listen(4000, function() {
	console.log('listening on *:4000');
});
