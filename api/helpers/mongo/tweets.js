// jshint esversion: 8
// jshint node: true
"use strict";

const Tweet = require('../../models/tweet');
const chalk = require('chalk');
// Tweet.index({text: 'text'});
const {bboxToPolygon} = require('../geoJSON');

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
            coordinates.push(tweet.places.coordinates.lng);
            coordinates.push(tweet.places.coordinates.lat);
            geometry['coordinates'] = coordinates;
            console.log(" Geometry: " + JSON.stringify(geometry));
            var newTweet = new Tweet({
                tweetId: tweet.tweetId,
                url: tweet.url,
                text: tweet.text,
                createdAt: tweet.createdAt,
                geometry: geometry,
                placeName: tweet.places.placeName,
                author: tweet.author,
                media: tweet.media
                // author und media noch splitten oder einfach als Mixed definieren??
            });
            try {
                console.log(newTweet);
                await newTweet.save();
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
 * @returns {Promise<void>}
 */
const getTweetsFromMongo = async function (filter, bbox) {
    // write words in the filter in a String to search for them
    // assumes the filter words format is an array


    // var words = filter[0];
    // if (filter.length > 1) {
    //     for (var i = 1; i < filter.length; i++) {
    //         words = filter[i] + " " + words;
    //     }
    // }
    var regExpWords;
    if(filter[0] !== ""){
      regExpWords = filter.map(function(e){ return new RegExp(e, "i"); });
    }

    // console.log(chalk.yellow("Searching for Tweets with keyword:" +words +""));
    var polygonCoords = [bboxToPolygon(bbox)];
    var polygon = {type: 'Polygon', coordinates: polygonCoords};
    console.log(polygon);
    try {
        var query = {};
        query.geometry = {$geoWithin: {$geometry: polygon}};
        if (regExpWords) {
            // query.$text = {$search: words};
            query.text = {$in: regExpWords};
        }
        const result= await Tweet.find(query);
        console.log("filtered Tweets: ");
        console.log(result);
        return result;
    } catch (err) {
        console.log(err);
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
