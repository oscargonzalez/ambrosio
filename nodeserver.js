/*
	Ambrosio Node.js Server
	Oscar Gonzalez - Mayo 2014
	www.bricogeek.com
*/

var  SYSTEM_NAME 	= "Ambrosio Node Webserver";
var  HTTP_PORT 		= 8080;	// Webserver port

var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , express = require('express');

server.listen(HTTP_PORT);
console.log(SYSTEM_NAME+' listening on port '+HTTP_PORT);

// FIX routing: Dependencias e la web
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');  
});

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/fonts', express.static(__dirname + '/fonts'));


// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {

// when the client emits 'sendchat', this listens and executes
socket.on('sendchat', function (data) {
// we tell the client to execute 'updatechat' with 2 parameters
io.sockets.emit('updatechat', socket.username, data);
});

// when the client emits 'opencmd', this listens and executes
socket.on('opencmd', function (data) {
// Add calls to IO here
io.sockets.emit('opencmd', socket.username, data);
setTimeout(function () {
  io.sockets.emit('openvalve', socket.username, data);
}, 1000)
});

// when the client emits 'closecmd', this listens and executes
socket.on('closecmd', function (data) {
// Add calls to IO here
io.sockets.emit('closecmd', socket.username, data);
setTimeout(function () {
  io.sockets.emit('closevalve', socket.username, data);
}, 1000)
});

// when the client emits 'adduser', this listens and executes
socket.on('adduser', function(username){
// we store the username in the socket session for this client
socket.username = username;
// add the client's username to the global list
usernames[username] = username;
// echo to client they've connected
socket.emit('updatechat', 'SERVER', 'you have connected');
// echo globally (all clients) that a person has connected
socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
// update the list of users in chat, client-side
io.sockets.emit('updateusers', usernames);
});

// when the user disconnects.. perform this
socket.on('disconnect', function(){
// remove the username from global usernames list
delete usernames[socket.username];
// update list of users in chat, client-side
io.sockets.emit('updateusers', usernames);
// echo globally that this client has left
socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
});

});


/*var net = require('net');

var server = net.createServer(function (socket) {
  socket.write('Echo server\r\n');
  socket.pipe(socket);
});

server.listen(1337, '127.0.0.1');
console.log('Ambrosio Node Server started on port 1337\n');
*/