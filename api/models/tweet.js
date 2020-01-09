// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

// All parameters "required" ?

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
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        required: true,
        index: { expires: 3600 }
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
        /*
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
        */
    },
    media: {  //[MediaSchema]
        type: mongoose.Mixed
    },
});

TweetSchema.index({text: 'text'});

module.exports = mongoose.model('Tweet', TweetSchema);
