// jshint esversion: 8
// jshint node: true
"use strict";

const request = require('request');
const querystring = require('querystring');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('config-yml');
const chalk = require('chalk');
const util = require('util');
const fs = require('fs');
const io = require("../socket-io").io;
const setIntervalPromise = util.promisify(setInterval);
const {saveExtremeWeatherInMongo} = require('../../helpers/mongo/extremeWeather');
const {weatherdata} = require('../../demo/weather.js');
const {numberValid} = require('../../helpers/validation/number');


/**
 * @desc requests the WFS from the DWD and stores the result.
 */
const requestExtremeWeather = function () {
    // https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=dwd%3AWarnungen_Gemeinden&outputFormat=text/xml;%20subtype=gml/3.1.1
    var demo = JSON.parse(fs.readFileSync('demo/isDemo.json')).demo;
    if (!demo) {
        console.log('real');
        var rootUrl = config.api.weather.dwd.wfs.url.protocol + '://' + config.api.weather.dwd.wfs.url.hostname + config.api.weather.dwd.wfs.url.path;
        var defaultParameters = {
            service: 'WFS',
            version: config.api.weather.dwd.wfs.parameter.version,
            request: 'GetFeature',
            typeName: config.api.weather.dwd.wfs.parameter.typeName,
            outputFormat: 'application/json',
            format_option: 'charset:UTF-8',
            srsName: 'EPSG:4326'
        };
        if (isSeverity()) {
            var severity = readSeverity();
            defaultParameters.cql_filter = "SEVERITY in (" + severity + ")";
        }

        var parameters = querystring.stringify(defaultParameters);

        const options = {
            url: rootUrl + '?' + parameters
        };
        try{
          request.get(options)
          .on('response', function (response) {
              // concatenate updates from datastream
              var body = '';
              var decoder = new StringDecoder('utf8');
              response.on('data', function (chunk) {
                  // @see: https://stackoverflow.com/questions/12121775/convert-streamed-buffers-to-utf8-string
                  //       https://nodejs.org/api/string_decoder.html
                  body += decoder.write(chunk);
              });
              response.on('end', function () {
                  try {
                      var features = JSON.parse(body).features;
                      io.emit('weatherStatus', {
                          timestamp: Date.now(),
                          success: true
                      });
                      saveExtremeWeatherInMongo(features);
                  } catch (err) {
                    io.emit('weatherStatus', {
                        timestamp: Date.now(),
                        success: false
                    });
                    // parameter of WFS are incorrect. Response is a XML-File
                    if((/<\?xml.*/).test(body.trim())){
                      console.log(chalk.red('DWD-Configuration is not complete respectively incorrect, especially the parameters.'));
                      process.exit(-1);
                    }
                    console.log(chalk.red('Error parsing weather data.'));
                  }
              });
          })
          .on('error', function (err) {
            io.emit('weatherStatus', {
                timestamp: Date.now(),
                success: false
            });
            console.log(chalk.red('DWD-Configuration is not complete respectively incorrect. More info:'));
            console.log(err);
            process.exit(-1);
          });
        }
        catch(err){
          console.log(chalk.red('DWD-Configuration is not complete respectively incorrect. More info:'));
          console.log(err);
          process.exit(-1);
        }
    }
    else {
        io.emit('weatherStatus', {
            timestamp: Date.now(),
            success: true
        });
        // save random weather-demo data
        var random = Math.floor(Math.random() * weatherdata.length);
        saveExtremeWeatherInMongo(weatherdata[random].features);
    }
};


/**
 * @desc if no severity-filter is true than return false, otherwise return true.
 * @return {Boolean}
 */
const isSeverity = function () {
    return !(!config.api.weather.dwd.wfs.parameter.filter.severity.moderate &&
        !config.api.weather.dwd.wfs.parameter.filter.severity.minor &&
        !config.api.weather.dwd.wfs.parameter.filter.severity.severe &&
        !config.api.weather.dwd.wfs.parameter.filter.severity.extreme);
};

/**
 * @desc creates a string from all options that are set to true.
 * @return {String}
 */
const readSeverity = function () {
    var severity = "";
    if (config.api.weather.dwd.wfs.parameter.filter.severity.moderate) {
        severity += "'Moderate'";
    }
    if (config.api.weather.dwd.wfs.parameter.filter.severity.minor) {
        severity += "'Minor'";
    }
    if (config.api.weather.dwd.wfs.parameter.filter.severity.severe) {
        severity += "'Severe'";
    }
    if (config.api.weather.dwd.wfs.parameter.filter.severity.extreme) {
        severity += "'Extreme'";
    }
    return severity.replace(/''/g, "','");
};

/**
 * @desc requests the WFS service from the DWD at periodic intervals and stores the result.
 */
const updateExtremeWeather = function () {
    numberValid(config.api.weather.dwd.wfs.refreshIntervall, 'DWD-Configuration is not complete respectively incorrect, especially the refresh-intervall.');
    requestExtremeWeather();
    // request extreme weather every XY seconds
    setIntervalPromise(function () {
        console.log(chalk.yellow.inverse('repetition'));
        requestExtremeWeather();
    }, 1000 * Number(config.api.weather.dwd.wfs.refreshIntervall));
};


module.exports = {
    requestExtremeWeather,
    updateExtremeWeather
};
