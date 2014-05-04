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
var  COLOR_ROJO     = '4';
var  COLOR_AZUL     = '5';
var  COLOR_BLANCO   = '6';
var  CLASIF_COMPLETADO   = '9';

var  WEB_STATUS_CONECTED      = '7';
var  WEB_STATUS_NOTCONECTED   = '8';

// Total de clasificación
var total_rojo   = 0;
var total_azul   = 0;
var total_blanco = 0;

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

// Reinicia los contadores de colores
function InitContadores()
{
  total_rojo   = 0;
  total_azul   = 0;
  total_blanco = 0;  
}

InitContadores();

var arduino_conection_status = 0; // No conectado a Node
var clients = [];
var socketWeb;

// Conexión websocket
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

  // Recibimos ordenes de control (play, pause y stop) desde la web
  socket.on('control', function (data) {
    console.log("CONTROL: "+data.cmd);

    // Lo envía al Arduino
    clients[0].write(data.cmd.toString());

    if (data.cmd == 3)
    {
      // Paramos la mñaquina y reiniciamos contadores
      console.log('Parar máquina y reiniciar');
      InitContadores();
      socketWeb.emit('status', { valor: WEB_STATUS_CONECTED, rojo: 0, azul: 0, blanco: 0 });
    }

  });

  // La web pregunta por el estado de conexión del socket de arduino
  socket.on('conexion', function (data) {
    console.log("Get Arduino conection status");  

    console.log('Websocket conectado')      
    
    if (arduino_conection_status == 1)
    {
      socketWeb.emit('status', { valor: WEB_STATUS_CONECTED, rojo: total_rojo, azul: total_azul, blanco: total_blanco });
    }
    else
    {
      socketWeb.emit('status', { valor: WEB_STATUS_NOTCONECTED, rojo: total_rojo, azul: total_azul, blanco: total_blanco });
    }    

  });  

});

// ---------------------

/*
  Recibir:
    4 rojo
    5 azul
    6 blanco
    9 Proceso completo (fin)

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
 
  console.log("- Arduino Conectado!");    
  arduino_conection_status = 1;
  if (socketWeb) { socketWeb.emit('status', { valor: WEB_STATUS_CONECTED, rojo: total_rojo, azul: total_azul, blanco: total_blanco }); }

  // Incoming data from client
  socket.on('data', function (data) {
    console.log("Incoming data ("+data.length+" bytes): "+data);

    for (var i = 0; i < data.length; i++) {
        console.log('Data ('+i+'): '+s.charAt(i));

        if (data == COLOR_ROJO) total_rojo++;
        if (data == COLOR_AZUL) total_azul++;
        if (data == COLOR_BLANCO) total_blanco++;

        socketWeb.emit('arduino', { color: data });

    }

  });  

  // Control de error de socket
  socket.on('error', function (data) {
    console.log("Arduino, error de conexioón: "+data);
    arduino_conection_status = 0;
    // Notificamos la web
    socketWeb.emit('status', { valor: WEB_STATUS_NOTCONECTED, rojo: total_rojo, azul: total_azul, blanco: total_blanco });    

  });

  // Cliente desconectado
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);    
    console.log("- Arduino desconectado!");
    arduino_conection_status = 0;

    socketWeb.emit('status', { valor: WEB_STATUS_NOTCONECTED, rojo: total_rojo, azul: total_azul, blanco: total_blanco });    

  });  

  
}).listen(ARDUINO_PORT);

