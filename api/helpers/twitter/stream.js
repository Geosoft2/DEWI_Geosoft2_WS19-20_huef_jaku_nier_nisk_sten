const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const request = require('request');
const util = require('util');
const turf= require('@turf/turf');
const chalk = require('chalk');

const get = util.promisify(request.get);
const post = util.promisify(request.post);

const {getUserInformation, getPlaceInformation} = require("./additionalInformation");

const io = require("../socket-io").io;

const twitterToken = require('../../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

//specify the twitter Endpoint to set/delete and get rules
const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');

let bbox;
let keyword;

var token;
//create twitter access Token
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});

const setRules = (rules) => {
    console.log(chalk.blue("Stream Rules are set to" + JSON.stringify(rules)));
    bbox = rules.bbox;
    keyword = rules.keyword;
};

/**
 * Get all active rules of the twitter stream
 * @returns {Promise<*>}
 */
const getAllRules = async function() {
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
const deleteAllRules = async function(rules) {
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
const setTwitterRules = async function(rules) {
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
const streamConnect = function() {
    // Listen to the stream
    const config = {
        url: 'https://api.twitter.com/labs/1/tweets/stream/filter?format=detailed&expansions=attachments.media_keys,geo.place_id,author_id',
        auth: {
            bearer: token,
        },
        timeout: 20000,
        agent: false,
        pool: {maxSockets: 100}
    };

    const stream = request.get(config);

    stream.on('data', async data => {
        try {
            const tweetJSON = JSON.parse(data);
            if (tweetJSON.connection_issue){
                stream.emit("timeout")
            }
            if (tweetJSON.data) {
                io.emit('timeout', false);
                console.log("Tweet Received");
                const tweet=tweetJSON.data;
                const userData=tweetJSON.includes.users[0];
                const author = getUserInformation(userData);
                var mongoDB = {
                    tweetId: tweet.id,
                    "url": "https://twitter.com/i/status/" + tweet.id,
                    "text": tweet.text,
                    "createdAt": tweet.created_at,
                    "author": author,
                    "media": [],
                    "places": {
                        "coordinates": {"lat": null, "lng": null},
                    },
                };
                if(tweetJSON.includes.media) {
                    for (var media of tweetJSON.includes.media) {
                        if(media.type=== "photo"){
                            mongoDB.media.push({"id": media.media_key, "url": media.url , type: media.type});
                        }
                        else{
                            mongoDB.media.push({"id": media.media_key, "url": media.preview_url, "type": media.type});
                        }
                    }
                }
                if (tweet.geo.coordinates) {
                    mongoDB.places.coordinates.lat = tweet.geo.coordinates.coordinates[1];
                    mongoDB.places.coordinates.lng = tweet.geo.coordinates.coordinates[0];
                } else {
                    const place = getPlaceInformation(tweetJSON.includes.places[0]);
                    mongoDB.places = place;
                }
                console.log(mongoDB);
                if(matchesTweetFilter(mongoDB, keyword, bbox)) {
                    console.log(chalk.blue("Tweet matches filter"));
                    io.emit('tweet', mongoDB)
                }
                else{
                    console.log(chalk.blue("Tweet don't matches filter"));
                }
            }
        }
        catch (e)
        {
            console.log(chalk.blue("Twitter Heartbeat received")); // Heartbeat received. Do nothing.
        }


    }).on('error', error => {
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            io.emit('timeout', true);
            stream.emit('timeout');
        }
    });

    return stream;
};

function matchesTweetFilter(tweet, keyword, bbox){
    console.log(chalk.blue("Proof Tweet against Keyword " + keyword + " and BBOX " + JSON.stringify(bbox)));
    if(keyword){
        if(!tweet.text.includes(keyword)){
            return false;
        }
    }
    if(bbox){
        if(!isTweetInMapextend(tweet.places.coordinates, bbox)){
            return false;
        }
    }
    return true;
}
/**
 * checks if the Tweet is located in the current mapextend
 * @param marker
 * @returns {*} boolean
 */
function isTweetInMapextend(tweetCoordinates, bounds) {
    var point = {   //convert the tweet location in a readable format for turf
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [tweetCoordinates.lat, tweetCoordinates.lng]
        },
        properties: {}
    };
    var bbox = turf.polygon([[
        [bounds.bbox.southWest.lat, bounds.bbox.southWest.lng],
        [bounds.bbox.southWest.lat, bounds.bbox.northEast.lng],
        [bounds.bbox.northEast.lat, bounds.bbox.northEast.lng],
        [bounds.bbox.northEast.lat, bounds.bbox.southWest.lng],
        [bounds.bbox.southWest.lat, bounds.bbox.southWest.lng]
    ]]);
    return turf.booleanWithin(point, bbox);
}


module.exports = {
    getAllRules,
    deleteAllRules,
    setRules,
    setTwitterRules,
    streamConnect,
};
