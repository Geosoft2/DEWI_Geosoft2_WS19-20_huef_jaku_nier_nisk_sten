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
const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');

var token;
/**
 * Creates a twiitter token
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
        return null;
    }

    return JSON.parse(response.body);
};


/**
 * Delete Rules of the twitter stream
 * @param rules to delete
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
        return null;
    }

    return response.body;
};


/**
 * Send additional Rules to the filter
 * @param rules to set
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
        return null;
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
        url: config.api.social.twitter.api.url.protocol+'://'+config.api.social.twitter.api.url.hostname+config.api.social.twitter.api.url.path.stream+'?'+querystring.stringify(defaultParameters),
        auth: {
            bearer: token,
        },
        timeout: config.api.social.twitter.api.parameter.stream.timeout,
        agent: config.api.social.twitter.api.parameter.stream.agent,
        pool: {
          maxSockets: config.api.social.twitter.api.parameter.stream.pool.maxSockets
        }
    };
    try{
      const stream = request.get(requestConfig);
      stream.on('data', async data => {
          try {
              const tweetJSON = JSON.parse(data);
              if (tweetJSON.connection_issue) {
                  stream.emit("timeout");
                  io.emit('timeout', true);

              }
              if (tweetJSON.data) {
                  io.emit('timeout', false);
                  console.log("Tweet Received");
                  const tweet = tweetJSON.data;
                  const userData = tweetJSON.includes.users[0];
                  const author = getUserInformation(userData);
                  var mongoDB = {
                      tweetId: tweet.id,
                      "url": "https://twitter.com/i/status/" + tweet.id,
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
              io.emit('timeout', true);
              stream.emit('timeout');
          }
          else {
            console.log(chalk.red('Twitter-Configuration is not complete respectively incorrect. More info:'));
            console.log(error);
            process.exit(-1);
          }
      });

      return stream;
    }
    catch(err){
      console.log(chalk.red('Twitter-Configuration is not complete respectively incorrect. More info:'));
      console.log(err);
      process.exit(-1);
    }
};

module.exports = {
    getToken,
    getAllRules,
    deleteAllRules,
    setTwitterRules,
    streamConnect
};
