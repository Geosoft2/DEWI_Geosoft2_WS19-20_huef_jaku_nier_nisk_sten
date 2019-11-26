// jshint esversion: 6
// jshint node: true
"use strict";

const request = require('request');
const chalk = require('chalk');

const requestExtremeWeather = function(){
  var url = 'http://localhost:3000/api/v1/dwd/extremeWeather';
  request.post(url/*, {form: req.body}*/) // BBOX is not necessary
    .on('response', function(response) {
      // concatenate updates from datastream
      var body = '';
      response.on('data', function(chunk){
          //console.log("chunk: " + chunk);
          body += chunk;
      });
      response.on('end', function(){
        if(response.statusCode !== 200){
          return console.log(chalk.red(body));
        }
        return saveExtremeWeather(JSON.parse(body));
      });
    })
    .on('error', function(err) {
      return console.log(chalk.red(err));
  });
};



const saveExtremeWeather = function(geoJSON){
  var url = 'http://localhost:3000/api/v1/mongo/extremeWeather';
  request.post(url, {form: geoJSON})
    .on('response', function(response) {
      // concatenate updates from datastream
      var body = '';
      response.on('data', function(chunk){
          //console.log("chunk: " + chunk);
          body += chunk;
      });
      response.on('end', function(){
        if(response.statusCode !== 200){
          return console.log(chalk.red(body));
        }
        return console.log(chalk.green(body));
      });
    })
    .on('error', function(err) {
      return console.log(chalk.red(err));
  });
};


module.exports = {
  requestExtremeWeather,
  saveExtremeWeather
};
