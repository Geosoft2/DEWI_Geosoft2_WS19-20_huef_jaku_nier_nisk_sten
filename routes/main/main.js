// jshint esversion: 6
// jshint node: true
"use strict";


const getMainPage = function(req, res){

  res.render('index', {
    title: 'Geosoftware 2',
  });
};


// Example for a post-Request in another request
// var request = require('request');

// router.get('/', function(req, res, next) {
//
//   var bbox = {
//     southWest: {
//       lat: 47.2704, // southWest.lng
//       lng: 6.6553 // southWest.lat
//     },
//     northEast: {
//       lat: 55.0444, // northEast.lng
//       lng: 15.0176 // southWest.lat
//     }
//   };
//   var url = 'http://localhost:3000/api/v1/dwd/extremeweather';
//
//   request.post(url, {form: 'bbox='+encodeURIComponent(JSON.stringify(bbox))})
//     .on('response', function(response) {
//       // concatenate updates from datastream
//       var body = '';
//       response.on('data', function(chunk){
//           //console.log("chunk: " + chunk);
//           body += chunk;
//       });
//       response.on('end', function(){
//         console.log(JSON.parse(body));
//         return res.render('index', {
//           title: 'Geosoftware 2',
//           data: JSON.parse(body)
//         });
//       });
//     })
//     .on('error', function(err) {
//       return res.render('index', {
//         title: 'Geosoftware 2',
//         error: err
//       });
//   });
// });

module.exports = {
  getMainPage
};
