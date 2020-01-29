// jshint esversion: 8
// jshint node: true
"use strict";

const Tweet = require('../../models/tweet');
const io = require("../socket-io").io;
const mongoose = require('mongoose');
const {bboxToPolygon, featureCollectionToGeometryCollection} = require('../geoJSON');
const {stringArrayValid} = require('../validation/array');
const {idValid} = require('../validation/id');
const {bboxValid} = require('../validation/bbox');
const {multiPolygonFeatureCollectionValid} = require('../validation/geojson');

/**
 * save tweet in database if it is not already stored
 * @param tweet
 * @returns {Promise<string|*>}
 */
const postTweet = async function (tweet) {
    var geometry = {};
    geometry['type'] = 'Point';

    if (tweet) {
        var tweetsWithId = await Tweet.find({tweetId: tweet.tweetId});

        if (tweetsWithId.length > 0) {
            return "Tweet is already stored in database.";
        } else {
            var tweetObject = {
                _id: mongoose.Types.ObjectId(),
                tweetId: tweet.tweetId,
                url: tweet.url,
                text: tweet.text,
                geometry: tweet.geometry,
                accuracy: tweet.accuracy,
                place: tweet.place,
                author: tweet.author,
                media: tweet.media
            };
            if (tweet.createdAt) {
                tweetObject.createdAt = tweet.createdAt;
            }
            else {
              tweetObject.createdAt = Date.now(); // for demo-purposes
            }
            if (tweet.demo) { // default: false
                tweetObject.demo = tweet.demo;
            }
            var newTweet = new Tweet(tweetObject);
            try {
                var savedTweet = await newTweet.save();
                io.emit('tweet', {
                  tweet: savedTweet
                });
                return "tweet stored in db.";
            } catch (e) {
                return e;
            }
        }
    }
};

/**
 * get all Tweets from the database, fitting to the filter and boundingbox
 * @param {array} filter with search words
 * @param {json} bbox with southWest: lat, lng and northEast: lat, lng
 * @param {geojson} extremeWeatherEvents
 * @returns {Promise<void>}
 */
const getTweetsFromMongo = async function (filter, bbox, extremeWeatherEvents) {
    try {
        var match = [];
        var result = [];
        if (filter) {
            const valid = stringArrayValid(filter, 'filter');
            if (valid.error) {
                return {
                    error: {
                        code: 400,
                        message: valid.error
                    }
                };
            }
            if (filter.length > 0) {
                var regExpWords = filter.map(function (e) {
                    var regExpEscape = e.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
                    return new RegExp(regExpEscape, "i");
                });
                match.push({
                    $match: {
                        // $text = {$search: words};
                        text: {$in: regExpWords}
                    }
                });
            }
        }
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
            var polygonCoords = [bboxToPolygon(bbox)];
            var bboxPolygon = {type: 'Polygon', coordinates: polygonCoords};
            match.push({
                $match: {
                    geometry: {
                        $geoWithin: {$geometry: bboxPolygon}
                    }
                }
            });
        }
        if (extremeWeatherEvents) {
            const valid = multiPolygonFeatureCollectionValid(extremeWeatherEvents, 'extremeWeatherEvents');
            if (valid.error) {
                return {
                    error: {
                        code: 400,
                        message: valid.error
                    }
                };
            }
            var geometryCollection = featureCollectionToGeometryCollection(extremeWeatherEvents);
            if (geometryCollection.geometries.length > 0) {
                match.push({
                    $match: {
                        geometry: {
                            $geoWithin: {$geometry: geometryCollection}
                        }
                    }
                });
                // Aggregation with extremeWeatherEvents-filter,
                // requirement: at least one feature
                result = await Tweet.aggregate(match);
            } // else: result is [], because no extremeWeatherEvent-MultiPolygon is delivered.
        } else {
            if (match.length > 0) {
                // Aggregation without extremeWeatherEvents-filter
                result = await Tweet.aggregate(match);
            } else {
                // no filter is set
                result = await Tweet.find({});
            }
        }
        return result;
    } catch (err) {
        if (err.errmsg && (/Loop must have at least 3 different vertices/).test(err.errmsg)) {
            return {
                error: {
                    code: 400,
                    message: "'Parameter \'extremeWeatherEvents\': Coordinates must have at least three different vertices.",
                }
            };
        }
        return {
            error: {
                code: 500,
                message: err,
            }
        };
    }
};

/**
 * get one Tweet from the database by ObjectID, fitting to the filter and boundingbox
 * @param {array} filter array with filter words
 * @param {JSON} bbox with southWest: lat, lng and northEast: lat, lng
 * @param {geojson} extremeWeatherEvents
 * @param {string} tweetId twitter-id
 * @param {string} headerId id to have the possibility to assigne the emit of "requestStatus"
 * @returns {Promise<void>}
 */
const getTweetFromMongo = async function (filter, bbox, extremeWeatherEvents, tweetId, headerId) {
    try {
        var result = []; // no result
        if (tweetId) {
            const valid = idValid(tweetId, 'objectId');
            if (valid.error) {
                return {
                    error: {
                        code: 400,
                        message: valid.error
                    }
                };
            }
            var match = [];
            match.push({
                $match: {
                    tweetId: parseInt(tweetId)
                }
            });
            if (filter) {
                const valid = stringArrayValid(filter, 'filter');
                if (valid.error) {
                    return {
                        error: {
                            code: 400,
                            message: valid.error
                        }
                    };
                }
                if (filter.length > 0) {
                    var regExpWords = filter.map(function (e) {
                        var regExpEscape = e.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
                        return new RegExp(regExpEscape, "i");
                    });
                    match.push({
                        $match: {
                            // $text = {$search: words};
                            text: {$in: regExpWords}
                        }
                    });
                }
            }
            if (bbox) {
                io.emit("requestStatus", {
                  id: headerId,
                  message: "Searching for Tweets."
                });
                const valid = bboxValid(bbox);
                if (valid.error) {
                    return {
                        error: {
                            code: 400,
                            message: valid.error
                        }
                    };
                }
                var polygonCoords = [bboxToPolygon(bbox)];
                var bboxPolygon = {type: 'Polygon', coordinates: polygonCoords};
                match.push({
                    $match: {
                        geometry: {
                            $geoWithin: {$geometry: bboxPolygon}
                        }
                    }
                });
            }
            if (extremeWeatherEvents) {
                const valid = multiPolygonFeatureCollectionValid(extremeWeatherEvents, 'extremeWeatherEvents');
                if (valid.error) {
                    return {
                        error: {
                            code: 400,
                            message: valid.error
                        }
                    };
                }
                var geometryCollection = featureCollectionToGeometryCollection(extremeWeatherEvents);
                if (geometryCollection.geometries.length > 0) {
                    match.push({
                        $match: {
                            geometry: {
                                $geoWithin: {$geometry: geometryCollection}
                            }
                        }
                    });
                    // Aggregation with extremeWeatherEvents-filter,
                    // requirement: at least one feature
                    result = await Tweet.aggregate(match);
                } // else: result is [], because no extremeWeatherEvent-MultiPolygon is delivered.
            } else {
                if (match.length > 1) {
                    // Aggregation without extremeWeatherEvents-filter
                    result = await Tweet.aggregate(match);
                } else {
                    result = await Tweet.find({tweetId: tweetId});
                }
            }
        }
        if (result.length > 0) {
            // maximal length is 1 -> only one document has the given ID.
            return result[0];
        } else {
            return {};
        }
    } catch (err) {
        if (err.errmsg && (/Loop must have at least 3 different vertices/).test(err.errmsg)) {
            return {
                error: {
                    code: 400,
                    message: "'Parameter \'extremeWeatherEvents\': Coordinates must have at least three different vertices.",
                }
            };
        }
        return {
            error: {
                code: 500,
                message: err,
            }
        };
    }
};

/**
 * remove all Tweets from database except the example data, created by DEWI
 * @returns {Promise<void>}
 */
const deleteDemoTweets = async function () {
    try {
        await Tweet.deleteMany({demo: true});
        console.log('All demo-tweets deleted');
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    postTweet,
    getTweetsFromMongo,
    getTweetFromMongo,
    deleteDemoTweets
};
