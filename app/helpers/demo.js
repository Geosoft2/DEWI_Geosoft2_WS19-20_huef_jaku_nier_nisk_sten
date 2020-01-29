// jshint esversion: 6
// jshint node: true
"use strict";

const request = require('request');

/**
 * @desc puts the demo-attribute at the api
 * @param {boolean} isDemo indicates if it is a demo or not
 * @param {callback} success callback that handles the success-response.
 * @param {callback} error callback that handles the error-response.
 */
const demoRequest = function(isDemo, success, error){
  var options = {
    'method': 'PUT',
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
      success();
    });
  })
  .on('error', function(err){
    error();
  });
};


module.exports = {
  demoRequest
};
