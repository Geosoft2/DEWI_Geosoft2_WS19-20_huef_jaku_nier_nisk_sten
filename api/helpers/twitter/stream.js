// jshint esversion: 8
// jshint node: true
"use strict";

const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const request = require('request');
const util = require('util');
const chalk = require('chalk');

const get = util.promisify(request.get);
const post = util.promisify(request.post);
const querystring = require('querystring');

const {getUserInformation, getPlaceInformation} = require("./additionalInformation");
const {postTweet} = require('../mongo/tweets.js');

const io = require("../socket-io").io;

const config = require('config-yml');

var oauth2 = new OAuth2(config.api.social.twitter.api.token.consumerKey, config.api.social.twitter.api.token.consumerSecret, config.api.social.twitter.api.url.protocol+'://'+config.api.social.twitter.api.url.hostname, null, config.api.social.twitter.api.url.path.token, null);

//specify the twitter Endpoint to set/delete and get rules
const rulesURL = new URL(config.api.social.twitter.api.url.protocol+'://'+config.api.social.twitter.api.url.hostname+config.api.social.twitter.api.url.path.stream.rules);

var token;
var configuration;

var timeout = 20000;
if(config.api.social.twitter.api.parameter.stream.timeout >= 20000){
  timeout = config.api.social.twitter.api.parameter.stream.timeout;
}

/**
 * Creates a twitter token
 */
const getToken = function () {
    //create twitter access Token
    return new Promise(
        function (resolve, restrict) {
            oauth2.getOAuthAccessToken('', {
                'grant_type': 'client_credentials'
            }, function (e, access_token) {
                token = access_token;
                resolve(e);
            });
        }
    );
};


/**
 * Get all active rules of the twitter stream
 * @returns {Promise<*>}
 */
const getAllRules = async function () {
    const requestConfig = {
        url: rulesURL,
        auth: {
            bearer: token
        }
    };

    const response = await get(requestConfig);
    //proof if request worked
    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return JSON.parse(response.body);
};


/**
 * Delete Rules of the twitter stream
 * @param {json} rules to delete
 * @returns {Promise<*>}
 */
const deleteAllRules = async function (rules) {
    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const requestConfig = {
        url: rulesURL,
        auth: {
            bearer: token
        },
        json: {
            delete: {
                ids: ids
            }
        }
    };

    const response = await post(requestConfig);

    //proof if request worked
    if (response.statusCode !== 200) {
        throw new Error(JSON.stringify(response.body));
    }

    return response.body;
};


/**
 * Send additional Rules to the filter
 * @param {array} rules to set
 * @returns {Promise<*>}
 */
const setTwitterRules = async function (rules) {
    const requestConfig = {
        url: rulesURL,
        auth: {
            bearer: token
        },
        json: {
            add: rules
        }
    };

    const response = await post(requestConfig);

    //proof if request worked
    if (response.statusCode !== 201) {
        throw new Error(JSON.stringify(response.body));
    }
    return response.body;
};

/**
 * Connect to the Twitter stream and send information via socket-io
 * @returns the stream
 */
const streamConnect = function () {
    // Listen to the stream
    const defaultParameters = {
        format: config.api.social.twitter.api.parameter.stream.format,
        expansions: config.api.social.twitter.api.parameter.stream.expansions
    };
    const requestConfig = {
        url: config.api.social.twitter.api.url.protocol+'://'+config.api.social.twitter.api.url.hostname+config.api.social.twitter.api.url.path.stream.filter+'?'+querystring.stringify(defaultParameters),
        auth: {
            bearer: token,
        },
        timeout: timeout,
        agent: config.api.social.twitter.api.parameter.stream.agent,
        pool: {
          maxSockets: config.api.social.twitter.api.parameter.stream.pool.maxSockets
        }
    };
    try{
      const stream = request.get(requestConfig);
      stream.on('data', async data => {
          try {
              configuration = true;
              const tweetJSON = JSON.parse(data);
              if (tweetJSON.connection_issue) {
                  stream.emit("timeout");
                  io.emit('twitterStatus', {
                    connected: false
                  });

              }
              if (tweetJSON.data) {
                  io.emit('twitterStatus', {
                    connected: true
                  });
                  const tweet = tweetJSON.data;
                  const userData = tweetJSON.includes.users[0];
                  const author = getUserInformation(userData);
                  var mongoDB = {
                      tweetId: tweet.id,
                      "url": config.api.social.twitter.app.url.protocol+'://'+config.api.social.twitter.app.url.hostname + config.api.social.twitter.app.url.path + "/" + tweet.id,
                      "text": tweet.text,
                      "createdAt": tweet.created_at,
                      "author": author,
                      "media": [],
                      geometry: {coordinates: []},
                      accuracy: 1
                  };
                  if (tweetJSON.includes.media) {
                      for (var media of tweetJSON.includes.media) {
                          if (media.type === "photo") {
                              mongoDB.media.push({"id": media.media_key, "url": media.url, type: media.type});
                          } else {
                              mongoDB.media.push({"id": media.media_key, "url": media.preview_url, "type": media.type});
                          }
                      }
                  }
                  if (tweet.geo.coordinates) {
                      mongoDB.geometry.coordinates = tweet.geo.coordinates.coordinates;
                  } else {
                      const place = getPlaceInformation(tweetJSON.includes.places[0]);
                      mongoDB.geometry.coordinates = [((place.bbox[0] + place.bbox[2]) / 2), ((place.bbox[1] + place.bbox[3]) / 2)];
                      mongoDB.place = place;
                      mongoDB.accuracy = (place.accuracy / 1000).toFixed(2);
                  }
                  postTweet(mongoDB);

              }
          } catch (e) {
              console.log(chalk.blue("Twitter Heartbeat received")); // Heartbeat received. Do nothing.
          }


      }).on('error', error => {
          if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
              io.emit('twitterStatus', {
                connected: false
              });
              stream.emit('timeout');
          }
          else if(!configuration){
            console.log(chalk.red('Twitter-Configuration is not complete respectively incorrect. More info:'));
            console.log(error);
            process.exit(-1);
          }
          else {
            io.emit('twitterStatus', {
              connected: false
            });
            stream.emit('timeout');
            console.log(chalk.red('Twitter-Reconnecting was not successfull. Possible error: no internet-connection.'));
          }
      });

      return stream;
    }
    catch(err){
      if(!configuration){
        console.log(chalk.red('Twitter-Configuration is not complete respectively incorrect. More info:'));
        console.log(err);
        process.exit(-1);
      }
      else {
        io.emit('twitterStatus', {
          connected: false
        });
        stream.emit('timeout');
        console.log(chalk.red('Twitter-Reconnecting was not successfull. Possible error: no internet-connection.'));
      }
    }
};


/**
 * sets stream
 */
const stream = async function () {

    let currentRules;
    const rules = [
        {value: "place_country:DE"},
    ];

    try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();
        // Delete all rules. Comment this line if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment this line if you want to keep your existing rules.
        await setTwitterRules(rules);
    } catch (e) {
        console.log(chalk.red('Twitter-Configuration is not complete respectively incorrect. More info:'));
        console.log(e);
        process.exit(-1);
    }

    // Listen to the stream.
    // This reconnection logic will attempt to reconnect when a disconnection is detected.

    let stream = streamConnect();
    console.log(chalk.blue("Connecting to Twitter Stream"));
    stream.on('timeout', () => {
        console.log(chalk.blue('A connection error occurred. Reconnecting…'));
        loopStreamConnect();
    });
};

/**
 * Loop to reconnect after a connection error occured
 */
const loopStreamConnect = () => {
    console.log(chalk.blue('Next Connection try in 20 seconds'));
    setTimeout(() => {
        console.log(chalk.blue('New try to Connect'));
        let stream = streamConnect();
        stream.on('timeout', () => {
            console.log(chalk.blue('A connection error occurred. Reconnecting…'));
            loopStreamConnect();
        });
    }, timeout);
};


module.exports = {
    getToken,
    stream
};
