// jshint esversion: 6
// jshint node: true
"use strict";

const request = require('request');
const chalk = require('chalk');

const saveExtremeWeather = function(cb){
  const options = {
    url: process.env.API_Domain + '/api/v1/dwd/extremeWeather',
  };
  request.post(options/*, {form: req.body}*/) // BBOX is not necessary
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
        if(body.includes('�')){
          console.log(chalk.red('�������������������������������'));
        }
        console.log(chalk.green(body));
        if(cb) return cb();
      });
    })
    .on('error', function(err) {
      return console.log(chalk.red(err));
  });
};



module.exports = {
  saveExtremeWeather
};
