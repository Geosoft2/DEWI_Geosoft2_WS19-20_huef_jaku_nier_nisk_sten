// jshint esversion: 8
// jshint node: true
"use strict";

const request = require('request');
const querystring = require('querystring');
const StringDecoder = require('string_decoder').StringDecoder;
const chalk = require('chalk');
const util = require('util');
const setIntervalPromise = util.promisify(setInterval);
const {saveExtremeWeatherInMongo} = require('../../helpers/mongo/extremeWeather');


/**
 * @desc requests the WFS from the DWD and stores the result.
 */
const requestExtremeWeather = function(){
  // https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=dwd%3AWarnungen_Gemeinden&outputFormat=text/xml;%20subtype=gml/3.1.1
  var rootUrl = 'https://maps.dwd.de/geoserver/dwd/ows';
  var defaultParameters = {
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: 'dwd:Warnungen_Gemeinden_vereinigt',
    outputFormat: 'application/json',
    format_option: 'charset:UTF-8',
    srsName: 'EPSG:4326',
    cql_filter: // Filter BBOX
    // 'BBOX(dwd:THE_GEOM, '+bbox.southWest.lat+','+bbox.southWest.lng+','+bbox.northEast.lat+','+bbox.northEast.lng+')'+
    // 'And '+
    // @see pp.16 https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geowebservice.pdf?__blob=publicationFile&v=11
    // Filter Severity
    "SEVERITY in ('Moderate', 'Minor')" // TODO: must be change into 'Severe', 'Extreme'
    // 'And '+
    // // Filter C_GROUP
    // "C_GROUP in ('THUNDERSTORM ', 'WIND', ...)"
  };

  var parameters = querystring.stringify(defaultParameters);

  const options = {
    url: rootUrl + '?' + parameters
  };
  request.get(options)
  .on('response', function(response) {
    // concatenate updates from datastream
    var body = '';
    var decoder = new StringDecoder('utf8');
    response.on('data', function(chunk){
      // @see: https://stackoverflow.com/questions/12121775/convert-streamed-buffers-to-utf8-string
      //       https://nodejs.org/api/string_decoder.html
      body += decoder.write(chunk);
    });
    response.on('end', function(){
      var features = JSON.parse(body).features;
      saveExtremeWeatherInMongo(features);
    });
  })
  .on('error', function(err) {
    console.log(chalk.red('Error: DWD WFS is not working.'));
  });
};


/**
 * @desc requests the WFS service from the DWD at periodic intervals and stores the result.
 */
const updateExtremeWeather = function(){
  requestExtremeWeather();
  // request extreme weather every XY seconds
  setIntervalPromise(function(){
    console.log(chalk.yellow.inverse('repetition'));
    requestExtremeWeather();
  }, 1000*60*Number(process.env.INTERVALL));
};


module.exports = {
  requestExtremeWeather,
  updateExtremeWeather
};
