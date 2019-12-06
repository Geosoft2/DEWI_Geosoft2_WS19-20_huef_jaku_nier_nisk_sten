// jshint esversion: 6
// jshint node: true
"use strict";

const request = require('request');
const querystring = require('querystring');
const StringDecoder = require('string_decoder').StringDecoder;
const chalk = require('chalk');


const getExtremeWeather = function(req, res){

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
    url: rootUrl + '?' + parameters,
    // headers: {
    //     'Accept': 'application/json',
    // }
  };
  request.get(options)
    .on('response', function(response) {
      // concatenate updates from datastream
      var body = '';
      var decoder = new StringDecoder('utf8');
      response.on('data', function(chunk){
          // console.log("chunk: " + chunk);
          // @see: https://stackoverflow.com/questions/12121775/convert-streamed-buffers-to-utf8-string
          //       https://nodejs.org/api/string_decoder.html
          body += decoder.write(chunk);
      });
      response.on('end', function(){
        if(body.includes('�')){ //Replacement character
          console.log(chalk.red('�������������������������������'));
        }
        return res.status(200).send({
          result: JSON.parse(body)
        });
      });
    })
    .on('error', function(err) {
      return res.status(500).send({
        message: 'Error: DWD WFS is not working.'
      });
    });
};

module.exports = {
  getExtremeWeather,
};
