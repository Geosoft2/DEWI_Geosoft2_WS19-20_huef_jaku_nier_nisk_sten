// jshint esversion: 8
// jshint node: true
"use strict";

const Tweet = require('../models/tweet');
// Tweet.index({text: 'text'});
const {bboxToPolygon} = require('./geoJSON');


const postTweet = async function (tweet) {
    var coordinates = [];
    var geometry = {};
    geometry['type'] = 'Point';
    console.log(tweet);
    console.log("Storing Tweet..");

    if (tweet) {
        // mongoose: findOneAndUpdate
        if (Tweet.find({tweetId: tweet.tweetId}).limit(1).size() > 0) {
            return "Tweet is already stored in database.";
        } else {
            coordinates.push(tweet.places.coordinates.lng);
            coordinates.push(tweet.places.coordinates.lat);
            geometry['coordinates'] = coordinates;
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
                await newTweet.save();
                return "tweet has been stored in db.";
            } catch (e) {
                return e;
            }
        }
    }
};

const getTweets = async function (filter, bbox) {
    // write words in the filter in a String to search for them
    // assumes the filter words format is an array
    var words = filter[0];
    if (filter.length > 1) {
        for (var i = 1; i < filter.length; i++) {
            words = filter[i] + " " + words;
        }
    }
    var polygon = bboxToPolygon(bbox);
    try {
        const result = await Tweet.find({
            $text: {$search: words},
            geometry: {$geoIntersects: {$geometry: {type: "Polygon", coordinates: [polygon]}}}
        }, {_id: 0}); //without _id (ObjectID)
        console.log("Tweet has been stored to MongoDB.");
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    postTweet,
    getTweets
};