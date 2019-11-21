// jshint esversion: 6
// jshint node: true
"use strict";

const request = require('request');
const querystring = require('querystring');


const postExtremeWeather = function(req, res){

  // console.log(req.body);
  var bbox = req.body.bbox;

  // https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=dwd%3AWarnungen_Gemeinden&outputFormat=text/xml;%20subtype=gml/3.1.1
  var rootUrl = 'https://maps.dwd.de/geoserver/dwd/ows';
  var defaultParameters = {
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: 'dwd:Warnungen_Gemeinden_vereinigt',
    outputFormat: 'application/json',
    srsName:'EPSG:4326',
    cql_filter: // Filter BBOX
                'BBOX(dwd:THE_GEOM, '+bbox.southWest.lat+','+bbox.southWest.lng+','+bbox.northEast.lat+','+bbox.northEast.lng+')'+
                'And '+
                // @see pp.16 https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geowebservice.pdf?__blob=publicationFile&v=11
                // Filter Severity
                "SEVERITY in ('Moderate', 'Minor')" // TODO: must be change into 'Severe', 'Extreme'
                // 'And '+
                // // Filter C_GROUP
                // "C_GROUP in ('THUNDERSTORM ', 'WIND', ...)"
  };

  var parameters = querystring.stringify(defaultParameters);
  var url = rootUrl + '?' + parameters;

  // console.log(url);

  request.get(url)
    .on('response', function(response) {
      // concatenate updates from datastream
      var body = '';
      response.on('data', function(chunk){
          //console.log("chunk: " + chunk);
          body += chunk;
      });
      response.on('end', function(){
          // console.log(JSON.parse(body));
          return res.status(200).send(JSON.parse(body));
      });
    })
    .on('error', function(err) {
      return res.status(400).send("Error: DWD WFS is not working");
    });
};

module.exports = {
  postExtremeWeather,
};
