// jshint esversion: 8
// jshint node: true
"use strict";

const Tweet = require('../../../../models/tweet');
Tweet.index({text: 'text'});
const {bboxToPolygon} = require('../../../../helpers/geoJSON');

const postTweet = async function(req, res) {
    var tweet = res.body.tweet;
    var coordinates = [];
    var geometry = {};
    geometry['type'] = 'Point';

    if(tweet) {
        Tweet.find({tweetId: tweet.tweetId}).exec().then(result => {
            if(result.length > 0) {
                // oder status 200, ist ja in dem Sinne kein Fehler?
                res.status(400).send('Tweet is already stored in database.');
            } else {
                coordinates.push(tweet.places.coordinates.lng);
                coordinates.push(tweet.places.coordinates.lat);
                geometry['coordinates'] = coordinates;
                var newTweet = new Tweet({
                    tweetId: tweet.Nid,
                    url: tweet.url,
                    text: tweet.text,
                    createdAt: tweet.createdAt,
                    geometry: geometry,
                    placeName: tweet.places.placeName,
                    author: tweet.author,
                    media: tweet.media
                    // author und media noch splitten oder einfach als Mixed definieren??
                });
                try{
                    await newTweet.save();
                }
                catch (e) {
                    console.log(e);
                    res.status(400).send('Error while storing Tweet in MongoDB.');
                }
            }
        })
    }
    else{
        res.status(200).send('Nothing to store.');
    }
};

const getTweets = async function(req, res) {
    var filter = req.query.filter;
    var polygon = bboxToPolygon(req.query.bbox);
    try {
        const result = await Tweet.find({
            // $text: { $search: filter},
            geometry: {$geoIntersects: {$geometry: {type: "Polygon", coordinates: [polygon]}}}
        }, {_id: 0}); //without _id (ObjectID)
        res.status(200).send(result);
    }
    catch(err){
        res.status(400).send('Error while getting extreme weather events from MongoDB.');
    }
};

module.exports = {
    postTweet,
    getTweets
}