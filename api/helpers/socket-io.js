var socket = require('socket.io');
var io = socket();
var socketApi ={};

socketApi.io = io;

io.on('connection', function(socket){
  console.log("user connected");
});

module.exports = socketApi;
