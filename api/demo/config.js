// jshint esversion: 8
// jshint node: true
"use strict";

const fs = require('fs');
const {requestExtremeWeather} = require('../helpers/weather/dwdWFS');
const {twitterdata} = require('../demo/twitter.js');
const {postTweet, deleteDemoTweets} = require('../helpers/mongo/tweets.js');

/**
 * @desc save Demo-Tweets in Database in a random order
 */
const saveDemoTweets = async function(){
  var shuffledTweets = twitterdata.sort(() => 0.5 - Math.random());
  var savedTweets = 0;
  while(JSON.parse(fs.readFileSync('demo/isDemo.json')).demo && savedTweets < shuffledTweets.length){
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
const isDemo = function(){
  var timestamp = Date.now();
  fs.watch('demo/isDemo.json', async (eventType, filename) => {
    var now = Date.now();
    // ensures that event is listen only once.
    if(timestamp+20 > now){
      requestExtremeWeather();
      await deleteDemoTweets(); // ensure that every demodata is deleted
      if(JSON.parse(fs.readFileSync('demo/isDemo.json')).demo){
        saveDemoTweets();
      }
    }
    timestamp = now;
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
