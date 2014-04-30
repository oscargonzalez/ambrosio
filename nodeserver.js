/*
	Ambrosio Node.js Server
	Oscar Gonzalez - Mayo 2014
	www.bricogeek.com
*/

var  SYSTEM_NAME 	  = "Ambrosio Node Webserver";
var  HTTP_PORT 		  = 8080;	// Webserver port
var  ARDUINO_PORT   = 5000; // Arduino
var  WEBSOCKET_PORT = 5001; // Web (websockets)
var  CONTROL_START  = '1';
var  CONTROL_PAUSE  = '2';
var  CONTROL_STOP   = '3';

var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , express = require('express')
  , net = require('net');

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
app.use('/node_modules', express.static(__dirname + '/node_modules'));

var clients = [];
var socketWeb;

// Eventos de la web
app.get('/start', function (req, res) {
  //res.sendfile(__dirname + '/app.css');  
  console.log('Start!');
  clients[0].write(CONTROL_START);
});

app.get('/pause', function (req, res) {
  //res.sendfile(__dirname + '/app.css');  
  console.log('Pause!');
  clients[0].write(CONTROL_PAUSE);
});

app.get('/stop', function (req, res) {  
  console.log('Stop!');
  clients[0].write(CONTROL_STOP);
});  


// ---------------------

/*
  Recibir:
    4 rojo
    5 azul
    6 blanco

  Enviar a Arduino:
    1: Start
    2: Pausa
    3: Stop
*/

// Conexión de Arduino
net.createServer(function (socket) {  
 
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 

  // Put this new client in the list
  clients.push(socket);   
 
  console.log("Conectado!");
  socket.write("Hola Arduino!\n");

  // Incoming data from client
  socket.on('data', function (data) {
    console.log("data: "+data);
    socketWeb.emit('arduino', { color: data });
  });  

  // Cliente desconectado
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    console.log("Arduino desconectado!");
  });  

  
}).listen(ARDUINO_PORT);

// ----------

var app2 = require('http').createServer(handler)
  , io = require('socket.io').listen(app2)
  , fs = require('fs')

app2.listen(WEBSOCKET_PORT);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socketWeb = socket;
  socket.emit('arduino', { color: 'rojo' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
