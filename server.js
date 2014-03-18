var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(process.env.OPENSHIFT_NODEJS_PORT || 8080,process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket){

	socket.on('message', function (message) {
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function (room) {
		var numClients = io.sockets.clients(room).length;
		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients == 1) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
	});

});

