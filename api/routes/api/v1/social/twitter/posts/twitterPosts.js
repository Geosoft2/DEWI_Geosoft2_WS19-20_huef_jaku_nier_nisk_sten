// jshint esversion: 8
// jshint node: true
"use strict";

const io = require("../../../../../../helpers/socket-io").io;
const {
    mongoSearch
} = require('../../../../../../helpers/twitter/search');


const {getTweetFromMongo} = require('../../../../../../helpers/mongo/tweets');


/**
 * @desc retrieves tweets
 * @param {object} req request, containing information about the HTTP request
 * @param {object} res response, to send back the desired HTTP response
 */
const postMongoSearch = async function (req, res) {
    io.emit("requestStatus", {
      id: req.id,
      message: "Received."
    });
    const filter = req.body.filter;
    const bbox = req.body.bbox;
    const extremeWeatherEvents = req.body.weatherEvents;


    const result = await mongoSearch(filter, bbox, extremeWeatherEvents);
    io.emit("requestStatus", {
      id: req.id,
      message: "Sending result."
    });

    if (result.error) {
        res.status(result.error.code).send({
            message: result.error.message
        });
    } else {
        const result2 = {tweets: result};
        res.status(200).json(result2);
    }

};

/**
 * @desc retrieves one tweet by Twitter-Id
 * @param {object} req request, containing information about the HTTP request
 * @param {object} res response, to send back the desired HTTP response
 */
const postMongoSearchById = async function (req, res) {
    io.emit("requestStatus", {
      id: req.id,
      message: "Received."
    });
    const filter = req.body.filter;
    const bbox = req.body.bbox;
    const extremeWeatherEvents = req.body.weatherEvents;
    const id = req.params.tweetId;


    const result = await getTweetFromMongo(filter, bbox, extremeWeatherEvents, id, req.id);
    io.emit("requestStatus", {
      id: req.id,
      message: "Sending result."
    });

    if (result.error) {
        res.status(result.error.code).send({
            message: result.error.message
        });
    } else {
        res.status(200).json({tweet: result});
    }
};


module.exports = {
    postMongoSearchById,
    postMongoSearch
};
