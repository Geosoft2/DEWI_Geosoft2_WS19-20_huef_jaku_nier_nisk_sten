// jshint esversion: 6
// jshint node: true
"use strict";

const socket = io('http://localhost:3001');

function testSocket(){
  socket.on('test', function (data) {
    console.log(data);
  });
}
