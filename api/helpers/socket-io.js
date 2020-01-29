// jshint esversion: 8
// jshint node: true
"use strict";

var socket = require('socket.io');
var io = socket();
var socketApi = {};

socketApi.io = io;

io.on('connection', function (socket) {
    console.log("socket-io: user connected");
});

module.exports = socketApi;
