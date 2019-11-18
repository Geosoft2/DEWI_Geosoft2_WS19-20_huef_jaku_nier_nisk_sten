// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

// schema for media
const MediaSchema = mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    }
});

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
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    places: {
        coordinates: {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            }
        },
        placeName: {
            type: String,
            required: true
        }
    },
    author: {
        id: {
           type: Number,
           required: true
        },
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    media: [MediaSchema]
});

module.exports = mongoose.model('Tweet', TweetSchema);