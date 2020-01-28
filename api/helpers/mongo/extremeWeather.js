// jshint esversion: 8
// jshint node: true
"use strict";

const ExtremeWeather = require('../../models/extremeWeather');
const moment = require('moment');
const config = require('config-yml');
const chalk = require('chalk');
const io = require("../socket-io").io;
const {emailNotification} = require('../notification/email');
const {mattermostNotification} = require('../notification/mattermost');
const {makeGeoJSonFromFeatures, bboxToPolygon} = require('../geoJSON');
const {bboxValid} = require('../validation/bbox');
const {stringArrayValid} = require('../validation/array');


/**
 * @desc stores the features in MongoDB if they are not yet existing. Also ensures
 * that only the current features are saved, i.e.: obsolete features are deleted.
 * @param {json} features features as result of the DWD-WFS-Request
 */
const saveExtremeWeatherInMongo = async function (features) {

    // only if data are available, data can be stored
    if (features) {
        var now = moment();
        var id = [];
        var newEvent = 0;
        var updatedEvent = 0;
        for (var i = 0; i < features.length; i++) {
            try {
                var weather = await ExtremeWeather.findOneAndUpdate({
                    type: features[i].type,
                    'geometry.type': features[i].geometry.type,
                    'geometry.coordinates': features[i].geometry.coordinates,
                    properties: features[i].properties
                }, {
                    $set: {updatedAt: now},
                    $setOnInsert: {createdAt: now}
                }, {
                    upsert: true,
                    rawResult: true,
                });
                // updated document
                if (weather.lastErrorObject.updatedExisting) {
                    id.push(weather.value._id); // ObjectId
                    updatedEvent += 1;
                }
                // new document
                else {
                    id.push(weather.lastErrorObject.upserted); // ObjectId
                    newEvent += 1;
                }
            } catch (err) {
                console.log(chalk.red('Error while storing data in MongoDB.'));
            }
        }
        var deletedEvent = await ExtremeWeather.deleteMany({_id: {$not: {$in: id}}});
        var stats = {
            new: newEvent,
            updated: updatedEvent,
            deleted: deletedEvent.deletedCount
        };
        if (newEvent + deletedEvent.deletedCount > 0) {
            var events = await ExtremeWeather.find({});
            io.emit('weatherchanges', {
                stats: stats,
                weatherEvents: makeGeoJSonFromFeatures(events)
            });
            emailNotification(stats);
            mattermostNotification(stats);
        }
        console.log(chalk.green(JSON.stringify({
            message: 'Everything is updated or stored.',
            stats: stats
        })));
    } else {
        await ExtremeWeather.deleteMany({});
        console.log(chalk.green('No data - nothing to store.'));
    }
};

/**
 * @desc stores the features in MongoDB if they are not yet existing. Also ensures
 * that only the current features are saved, i.e.: obsolete features are deleted.
 * @param {json} bbox coordinates of a BBOX to query all features which intersects the BBOX.
 * @param {array} events events to query the MongoDB.
 * @param {object} res response, to send back the desired HTTP response
 */
const getExtremeWeatherFromMongo = async function (bbox, events, res, id) {
    io.emit("status", id + ": Searching for extreme weather ares in bbox");
    try {
        var query = {};
        // ensures that only current data is output
        query.updatedAt = {$gt: moment().subtract(config.api.weather.dwd.wfs.refreshIntervall, 'seconds')};
        // optional search-parameter bbox
        if (bbox) {
            const valid = bboxValid(bbox);
            if (valid.error) {
                return {
                    error: {
                        code: 400,
                        message: valid.error
                    }
                };
            }
            var bboxPolygon = bboxToPolygon(bbox);
            query.geometry = {$geoIntersects: {$geometry: {type: "Polygon", coordinates: [bboxPolygon]}}};
        }
        // optional search-parameter events
        if (events) {
            const valid = stringArrayValid(events, 'events');
            console.log(valid);
            if (valid.error) {
                return {
                    error: {
                        code: 400,
                        message: valid.error
                    }
                };
            }
            // create a regular Expression to cover all possible combinations in 'EC_Group' (e.g.: FOG; FROST)
            var regExEvents = events.map(function (e) {
                return new RegExp(e, "i");
            });
            query['properties.EC_GROUP'] = {$in: regExEvents};
        }
        const result = await ExtremeWeather.find(query, {_id: 0}); //without _id (ObjectID)
        io.emit("status", id + ": Sending result");

        return makeGeoJSonFromFeatures(result);
    } catch (err) {
        io.emit("status", id + ": Sending result");
        return {
            error: {
                code: 500,
                message: err,
            }
        };
    }
};

module.exports = {
    saveExtremeWeatherInMongo,
    getExtremeWeatherFromMongo
};
