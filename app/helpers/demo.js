// jshint esversion: 6
// jshint node: true
"use strict";

const request = require('request');


const demoRequest = function(isDemo, cb){
  var options = {
    'method': 'POST',
    'url': 'http://'+process.env.API_HOST+'/api/v1/demo',
    'headers': {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"active": isDemo})
  };
  request(options)
  .on('response', function(response) {
    // concatenate updates from datastream
    var body = '';
    response.on('data', function(chunk){
        //console.log("chunk: " + chunk);
        body += chunk;
    });
    response.on('end', function(){
      cb();
    });
  })
  .on('error', function(err){
    cb();
  });
};


module.exports = {
  demoRequest
};
