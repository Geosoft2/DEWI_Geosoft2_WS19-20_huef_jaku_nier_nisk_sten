const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const request = require('request');
const util = require('util');

const get = util.promisify(request.get);
const post = util.promisify(request.post);

const {getUserInformation, getPlaceInformation} = require("./additionalInformation");

const io = require("../socket-io").io;

const twitterToken = require('../../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');

var token;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});


const getAllRules = async function() {
    const requestConfig = {
        url: rulesURL,
        auth: {
            bearer: token
        }
    };

    const response = await get(requestConfig);
    if (response.statusCode !== 200) {
        throw new Error(response.body);
        return null;
    }

    return JSON.parse(response.body);
};



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
    if (response.statusCode !== 200) {
        throw new Error(JSON.stringify(response.body));
        return null;
    }

    return response.body;
};





const setRules = async function(rules) {
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
    if (response.statusCode !== 201) {
        throw new Error(JSON.stringify(response.body));
        return null;
    }
    return response.body;
};


const streamConnect = function() {
    // Listen to the stream
    const config = {
        url: 'https://api.twitter.com/labs/1/tweets/stream/filter?format=detailed&expansions=attachments.media_keys',
        auth: {
            bearer: token,
        },
        timeout: 20000,
    };

    const stream = request.get(config);

    stream.on('data', async data => {
        try {
            const tweetJSON = JSON.parse(data);
            console.log(tweetJSON);
            if (tweetJSON.data) {
                io.emit('timeout', false);
                console.log("Tweet Received");
                const tweet=tweetJSON.data;
                const author = await getUserInformation(tweet.author_id);
                var mongoDB = {
                    "Nid": tweet.id,
                    "url": "https://twitter.com/i/status/" + tweet.id,
                    "text": tweet.text,
                    "createdAt": tweet.created_at,
                    "author": author,
                    "media": [],
                    "places": {
                        "coordinates": {"lat": null, "lng": null},
                    },
                };
                if(tweetJSON.includes) {
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
                    const place = await getPlaceInformation(tweet.geo.place_id);
                    mongoDB.places = place;
                }
                io.emit('tweet', mongoDB);
            }
        }
        catch (e)
        {
            console.log(e);
            console.log("Twitter Heartbeat received"); // Heartbeat received. Do nothing.
        }


    }).on('error', error => {
        console.log(error);
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            io.emit('timeout', true);
            stream.emit('timeout');
        }
    });

    return stream;
};

module.exports = {
    getAllRules,
    deleteAllRules,
    setRules,
    streamConnect,
};
