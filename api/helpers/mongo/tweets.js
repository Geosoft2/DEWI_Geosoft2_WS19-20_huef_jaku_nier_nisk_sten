// jshint esversion: 8
// jshint node: true
"use strict";

const Tweet = require('../../models/tweet');
const chalk = require('chalk');
const io = require("../socket-io").io;
const mongoose = require('mongoose');
// Tweet.index({text: 'text'});
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
    var coordinates = [];
    var geometry = {};
    geometry['type'] = 'Point';
    console.log(tweet);
    console.log("Storing Tweet..");

    if (tweet) {
        // mongoose: findOneAndUpdate
        /*try {
            var savedTweet = await Tweet.findOneAndUpdate({
                tweetId: tweet.tweetId
            }, {
                tweet
            }, {
                new: true,
                upsert: true,
                rawResult: true,
            });
        } catch (err) {
            console.log(err);
            res.status(400).send({
                message: 'Error while storing data in MongoDB.'
            });
        }*/
        var tweetsWithId = await Tweet.find({tweetId: tweet.tweetId});
        console.log("size: " + tweetsWithId.length);

        if (tweetsWithId.length > 0) {
            return "Tweet is already stored in database.";
        } else {
            var newTweet = new Tweet({
                _id: mongoose.Types.ObjectId(),
                tweetId: tweet.tweetId,
                url: tweet.url,
                text: tweet.text,
                createdAt: tweet.createdAt,
                geometry: tweet.geometry,
                accuracy: tweet.accuracy,
                place: tweet.place,
                author: tweet.author,
                media: tweet.media
                // author und media noch splitten oder einfach als Mixed definieren??
            });
            try {
                console.log(newTweet);
                var savedTweet = await newTweet.save();
                io.emit('tweet', savedTweet);
                return "tweet stored in db.";
            } catch (e) {
                return e;
            }
        }
    }
};



/**
 * get all Tweets from the database, fitting to the filter and boundingbox
 * @param filter: array with filter words
 * @param bbox: JSON with southWest: lat, lng and northEast: lat, lng
 * @param {geojson} extremeWeatherEvents
 * @returns {Promise<void>}
 */
const getTweetsFromMongo = async function (filter, bbox, extremeWeatherEvents) {
    try {
      var match = [];
      var result = [];
      if(filter){
        console.log(filter);
          const valid= stringArrayValid(filter, 'filter');
          if(valid.error){
              return{
                  error: {
                      code: 400,
                      message : valid.error
                  }
              };
          }
          if(filter.length > 0){
            var regExpWords = filter.map(function(e){
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
      if(bbox){
        const valid = bboxValid(bbox);
        if(valid.error){
            return {
                error: {
                    code: 400,
                    message : valid.error
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
      if(extremeWeatherEvents){
        const valid = multiPolygonFeatureCollectionValid(extremeWeatherEvents, 'extremeWeatherEvents');
        if(valid.error){
            return {
                error: {
                    code: 400,
                    message : valid.error
                }
            };
        }
        var geometryCollection = featureCollectionToGeometryCollection(extremeWeatherEvents);
        if(geometryCollection.geometries.length > 0){
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
      }
      else {
        if(match.length > 0){
          // Aggregation without extremeWeatherEvents-filter
          result = await Tweet.aggregate(match);
        }
        else {
          // no filter is set
          result = await Tweet.find({});
        }
      }

      console.log("filtered Tweets: ");
      console.log(result);
      return result;
    } catch (err) {
        if(err.errmsg && (/Loop must have at least 3 different vertices/).test(err.errmsg)){
          return {error: {
              code: 400,
              message: "'Parameter \'extremeWeatherEvents\': Coordinates must have at least three different vertices.",
              }
          };
        }
        console.log(err);
        return {error: {
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
 * @param {string} id mongoDB-ObjectID
 * @returns {Promise<void>}
 */
const getTweetFromMongo = async function (filter, bbox, extremeWeatherEvents, id) {
    try {
      var result = []; // no result
      if (id) {
        const valid = idValid(id, 'objectId');
        if(valid.error){
            return{
                error: {
                    code: 400,
                    message : valid.error
                }
            };
        }
        var match = [];
        match.push({
          $match: {
            _id: new mongoose.Types.ObjectId(id)
          }
        });
        if(filter){
            const valid= stringArrayValid(filter, 'filter');
            if(valid.error){
                return{
                    error: {
                        code: 400,
                        message : valid.error
                    }
                };
            }
            if(filter.length > 0){
              var regExpWords = filter.map(function(e){
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
        if(bbox){
          const valid = bboxValid(bbox);
          if(valid.error){
              return {
                  error: {
                      code: 400,
                      message : valid.error
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
        if(extremeWeatherEvents){
          const valid = multiPolygonFeatureCollectionValid(extremeWeatherEvents, 'extremeWeatherEvents');
          if(valid.error){
              return {
                  error: {
                      code: 400,
                      message : valid.error
                  }
              };
          }
          var geometryCollection = featureCollectionToGeometryCollection(extremeWeatherEvents);
          if(geometryCollection.geometries.length > 0){
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
        }
        else {
          if(match.length > 1){
            // Aggregation without extremeWeatherEvents-filter
            result = await Tweet.aggregate(match);
          }
          else {
            result = await Tweet.find({_id: id});
          }
        }
      }
      console.log("filtered Tweet: ");
      if(result.length > 0){
        console.log(result[0]); // maximal length is 1 -> only one Document has the given ID.
        return result[0];
      }
      else{
        console.log({});
        return {};
      }
    } catch (err) {
        if(err.errmsg && (/Loop must have at least 3 different vertices/).test(err.errmsg)){
          return {error: {
              code: 400,
              message: "'Parameter \'extremeWeatherEvents\': Coordinates must have at least three different vertices.",
              }
          };
        }
        console.log(err);
        return {error: {
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
const deleteTweets = async function() {
    await Tweet.remove({author: { name : {$ne: "DEWI"} } });
};

module.exports = {
    postTweet,
    getTweetsFromMongo,
    getTweetFromMongo
};
