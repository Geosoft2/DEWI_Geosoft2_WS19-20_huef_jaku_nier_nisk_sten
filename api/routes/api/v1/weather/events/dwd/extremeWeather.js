// jshint esversion: 8
// jshint node: true
"use strict";

const {getExtremeWeatherFromMongo} = require('../../../../../../helpers/mongo/extremeWeather');
const io = require("../../../../../../helpers/socket-io").io;

/**
 * @desc retrieves the weatherExtreme events
 * @param {object} req request, containing information about the HTTP request
 * @param {object} res response, to send back the desired HTTP response
 */
const getExtremeWeather = async function (req, res) {
    io.emit("status", req.id + ": Received");
    var bbox = req.body.bbox;
    var events = req.body.events; // output: ['FOG', 'FROST']
    var result = await getExtremeWeatherFromMongo(bbox, events, res, req.id);

    if (result.error) {
        res.status(result.error.code).send({
            message: result.error.message
        });
    } else {
        console.log("sending result");
        res.status(200).send({weatherEvents: result});
    }
};

module.exports = {
    getExtremeWeather
};
