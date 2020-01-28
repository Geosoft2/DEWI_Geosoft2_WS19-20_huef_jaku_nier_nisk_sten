// jshint esversion: 8
// jshint node: true
"use strict";

const fs = require('fs');
const gaze = require('gaze'); // fs.watch() does not work in dcoker
const path = require('path');
const {requestExtremeWeather} = require('../helpers/weather/dwdWFS');
const {twitterdata} = require('../demo/twitter.js');
const {postTweet, deleteDemoTweets} = require('../helpers/mongo/tweets.js');

/**
 * @desc save Demo-Tweets in Database in a random order
 */
const saveDemoTweets = async function () {
    var shuffledTweets = twitterdata.sort(() => 0.5 - Math.random());
    var savedTweets = 0;
    while (JSON.parse(fs.readFileSync(path.join(__dirname, 'isDemo.json'))).demo && savedTweets < shuffledTweets.length) {
        await postTweet(shuffledTweets[savedTweets]);
        var randomInt = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
        await timeout(randomInt); // between 3 and 5 seconds
        savedTweets += 1;
    }
};

/**
 * @desc checks if Demo-Mode is activated;
 *  active: save demo-weather and -tweets in database
 *  not active: deletes all Demo-Tweets and request the "normal" weather-data
 */
const isDemo = function () {
    // default at server-start: demo is deactivated
    var content = {demo: false};
    fs.writeFileSync(path.join(__dirname, 'isDemo.json'), JSON.stringify(content));
    // watch isDemo.js file in process.cwd()
    gaze(path.join(__dirname, 'isDemo.json'), function (err, watcher) {
        this.on('changed', async function (filepath) {
            console.log(filepath + ' was changed');
            requestExtremeWeather();
            await deleteDemoTweets(); // ensure that every demodata is deleted
            if (JSON.parse(fs.readFileSync(path.join(__dirname, 'isDemo.json'))).demo) {
                saveDemoTweets();
            }
        });
    });
};

/**
 * @desc forces a timeout
 * @param {Integer} ms time in milliseconds
 */
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    isDemo
};
