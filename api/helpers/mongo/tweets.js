// jshint esversion: 8
// jshint node: true
"use strict";

const Tweet = require('../../models/tweet');
const chalk = require('chalk');
const io = require("../socket-io").io;
// Tweet.index({text: 'text'});
const {bboxToPolygon, isBbox, featureCollectionToGeometryCollection} = require('../geoJSON');

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
                await newTweet.save();
                io.emit('tweet', newTweet);
                return "tweet stored in db.";
            } catch (e) {
                return e;
            }
        }
    }
};

const filterValid = (filter) => {
        if(!Array.isArray(filter)){
            return{error: "filter mus be an array"}
        }
        else if(filter.every(function(i){ return typeof i === "string" }) == false){
            return{error: "filter mus be an Array of Strings"}
        }
        else{
            return true
        }

}

/**
 * get all Tweets from the database, fitting to the filter and boundingbox
 * @param filter: array with filter words
 * @param bbox: JSON with southWest: lat, lng and northEast: lat, lng
 * @returns {Promise<void>}
 */
const getTweetsFromMongo = async function (filter, bbox, extremeWeatherEvents, createdAt) {
    // write words in the filter in a String to search for them
    // assumes the filter words format is an array


    // var words = filter[0];
    // if (filter.length > 1) {
    //     for (var i = 1; i < filter.length; i++) {
    //         words = filter[i] + " " + words;
    //     }
    // }

    var regExpWords;
    if(filter){
        const valid= filterValid(filter);
        if(valid.error){
            return{
                error: {
                    code: 400,
                    message : valid.error
                }
            };
        }
        if(filter.length > 0){
          regExpWords = filter.map(function(e){
            var regExpEscape = e.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
            return new RegExp(regExpEscape, "i");
          });
        }
    }

    // console.log(chalk.yellow("Searching for Tweets with keyword:" +words +""));
    try {
      var match = [];
      var result = [];
      if (createdAt) {
        // TODO: Validation!!
        match.push({
          $match: {
            createdAt: {$eq: new Date(createdAt)}
          }
        });
      }
      if (regExpWords) {
        // TODO: Validation!!
        match.push({
          $match: {
            // $text = {$search: words};
            text: {$in: regExpWords}
          }
        });
      }
      if(bbox){
        const valid = isBbox(bbox);
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
        // TODO: Validation!!
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
        // Aggregation without extremeWeatherEvents-filter
        result = await Tweet.aggregate(match);
      }

      console.log("filtered Tweets: ");
      console.log(result);
      return result;
    } catch (err) {
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
    getTweetsFromMongo
};
