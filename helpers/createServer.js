// jshint esversion: 6
// jshint node: true
"use strict";

var http = require('http');
var debug = require('debug')('app:server');
const chalk = require('chalk');


const createServer = function(app, port, name, cb){
  /**
   * Create HTTP server.
   */
  var server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port, () => console.log(chalk.green.inverse(name+" listening on port " + port + "!")));
  server.on('error', onError);
  server.on('listening', onListening);
  if(cb) cb();

  /**
   * Event listener for HTTP server "error" event.
   */
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }

};




module.exports = {
  createServer
};
