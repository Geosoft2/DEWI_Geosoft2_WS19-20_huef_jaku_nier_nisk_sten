// jshint esversion: 6
// jshint node: true
"use strict";

var express = require('express');
var router = express.Router();
var request = require('request');
const querystring = require('querystring');


router.post('/extremeweather', function(req, res, next) {

  console.log(req.body);
  var bbox = JSON.parse(req.body.bbox);

  var rootUrl = 'https://maps.dwd.de/geoserver/dwd/ows';
  var defaultParameters = {
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: 'dwd:Warnungen_Gemeinden',//_vereinigt',
    // maxFeatures: 200,
    outputFormat: 'application/json',
    srsName:'EPSG:4326',
    bbox: bbox.southWest.lng + ',' + bbox.southWest.lat + ',' + bbox.northEast.lng + ',' + bbox.northEast.lat + ',EPSG:4326'
  };

  var parameters = querystring.stringify(defaultParameters);
  var url = rootUrl + '?' + parameters;

  console.log(url);

  request.get(url)
    .on('response', function(response) {
      // concatenate updates from datastream
      var body = '';
      response.on('data', function(chunk){
          //console.log("chunk: " + chunk);
          body += chunk;
      });
      response.on('end', function(){
          console.log(JSON.parse(body));
          return res.status(200).send(JSON.parse(body));
      });
    })
    .on('error', function(err) {
      return res.status(400).send("Error: DWD WFS is not working");
    });
});

module.exports = router;
