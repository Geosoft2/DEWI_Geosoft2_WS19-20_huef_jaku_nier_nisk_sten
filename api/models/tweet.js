// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');
const config = require('config-yml');

// All parameters "required" ?
// schema for tweet
const TweetSchema = mongoose.Schema({
    tweetId: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now(),
        index: {expires: Number(config.social.twitter.storageDuration)}
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number]
        }
    },
    place: {
        type: mongoose.Mixed
    },
    accuracy: {
        type: Number
    },
    author: {
        type: mongoose.Mixed
    },
    media: {
        type: mongoose.Mixed
    },
    demo: {
        type: Boolean,
        required: true,
        default: false
    }
});

TweetSchema.index({text: 'text'});

module.exports = mongoose.model('Tweet', TweetSchema);
