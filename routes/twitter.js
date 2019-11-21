module.exports =  function(io) {
// jshint esversion: 6
// jshint node: true
    "use strict";

    const express = require('express');
    const router = express.Router();
    const OAuth = require('oauth');
    const OAuth2 = OAuth.OAuth2;
    const request = require('request');
    const util = require('util');
    const https = require('https');


   const get = util.promisify(request.get);
   const post = util.promisify(request.post);

    const twitterToken = require('../private/token.js').token.twitter_config;

    var oauth = new OAuth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        twitterToken.consumerKey,
        twitterToken.consumerSecret,
        '1.0A',
        null,
        'HMAC-SHA1'
    );

   var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

    var token;
   oauth2.getOAuthAccessToken('', {
        'grant_type': 'client_credentials'
    }, function (e, access_token) {
        token = access_token;
        console.log(token)
    });

   const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');

    async function getUserInformation(userId){

        return new Promise(async function (resolve, reject) {
            const url = "https://api.twitter.com/1.1/users/show.json?user_id=" + userId;
            const requestConfig = {
                url: url,
                auth: {
                    bearer: token
                }
            };


            const response = await get(requestConfig);
            if (response.statusCode !== 200) {
                throw new Error(response.body);
                return null;
            }

            const result = JSON.parse(response.body);
            const parsedResult = {"id": result.id, "name": result.name, "URL": "twitter.com/" + result.screen_name};

            resolve(parsedResult)
        });

    }

    async  function search(query, bbox, since) {

        return new Promise(function (resolve, reject) {
            let endpoint = 'https://api.twitter.com/1.1/tweets/search/30day/dev.json?query=';

            if (!query || typeof query !== "string") {
                resolve({error: "filter is a required Parameter and must be a string", code: 400});
            } else {
                endpoint += '"' + query + '"';
            }
            if (bbox) {
                endpoint += " bounding_box: [" + String(bbox.southWest.lng) + " " + String(bbox.southWest.lat) + " " + String(bbox.northEast.lng) + " " + String(bbox.northEast.lat) + "]";
            }
            if (since) {
                let date = Date.now();
                date = date - since * 60 * 1000;
                const twitterDate = new Date(date);
                const twitterDateString = String(twitterDate.getFullYear()) + ("0" + (twitterDate.getUTCMonth() + 1)).slice(-2) + ("0" + twitterDate.getUTCDate()).slice(-2) + ("0" + twitterDate.getUTCHours()).slice(-2) + ("0" + twitterDate.getUTCMinutes()).slice(-2);
                endpoint += "&fromDate=" + twitterDateString
            }

            const options = {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            };

            https.get(endpoint, options, (httpResponse) => {
                // concatenate updates from datastream

                var body = "";
                httpResponse.on("data", (chunk) => {
                    //console.log("chunk: " + chunk);
                    body += chunk;
                });

                httpResponse.on("end", () => {

                    try {

                        var twitterResponse = JSON.parse(body);


                        var mongoDBs = {tweets: []};
                        for (var tweet of twitterResponse.results) {
                            var mongoDB = {
                                "Nid": tweet.id_str,
                                "url": "https://twitter.com/i/status/" + tweet.id_str,
                                "text": tweet.text,
                                "createdAt": tweet.created_at,
                                "author": {
                                    "id": tweet.user.id,
                                    "name": tweet.user.name,
                                    "url": "https://twitter.com/" + tweet.user.screen_name
                                },
                                "media": [],
                                "places": {
                                    "coordinates": {"lat": null, "lng": null},
                                },
                            };
                            if (tweet.entities.media) {
                                for (var media of tweet.entities.media) {
                                    mongoDB.media.push({"id": media.id, "url": media.media_url})
                                }
                            }
                            if (tweet.geo) {
                                mongoDB.places.coordinates.lat = tweet.geo.coordinates[1];
                                mongoDB.places.coordinates.lng = tweet.geo.coordinates[0];
                            } else if (tweet.place) {
                                mongoDB.places.coordinates.lat = ((tweet.place.bounding_box.coordinates[0][0][1] + tweet.place.bounding_box.coordinates[0][1][1]) / 2);
                                mongoDB.places.coordinates.lng = ((tweet.place.bounding_box.coordinates[0][0][0] + tweet.place.bounding_box.coordinates[0][2][0]) / 2);
                                mongoDB.places.placeName = tweet.place.full_name
                            }

                            mongoDBs.tweets.push(mongoDB)

                        }

                        resolve(mongoDBs);
                    } catch (err) {
                        console.log(err);
                        resolve({error: err, code: 500});
                    }
                });

                httpResponse.on("error", (error) => {
                    // JL().warn("Twitter Api not working" + error);
                    return {error: "Twitter Api is not working", code: 500};
                });
            });

        })
    }

    async function getPlaceInformation(placeId){

        const url= "https://api.twitter.com/1.1/geo/id/" + placeId +".json";

        return new Promise(function (resolve, reject) {
            oauth.get(
                url,
                twitterToken.accessToken,
                //you can get it at dev.twitter.com for your own apps
                twitterToken.accessTokenSecret,
                //you can get it at dev.twitter.com for your own apps
                function (e, data, res) {
                    if (e) console.error(e);
                    else {
                        const result = JSON.parse(data);
                        const parsedResult = {"name": result.full_name,
                            "coordinates": {
                                "lat": ((result.bounding_box.coordinates[0][0][1] + result.bounding_box.coordinates[0][1][1]) / 2),
                                "lng": ((result.bounding_box.coordinates[0][2][0] +result.bounding_box.coordinates[0][0][0])/ 2)
                            }
                        };
                        console.log(result);
                        resolve(parsedResult)
                    };
                });
        });
    }

    async function getAllRules(token) {
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
    }

    async function deleteAllRules(rules, token) {
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
    }

    async function setRules(rules, token) {
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
    }

    function getMediaKey (authorID, mediaKey){

        var url= "https://ads-api.twitter.com/6/accounts/" +authorID +"/media_library/" +mediaKey;

        return new Promise(function (resolve, reject) {
            oauth.get(
                url,
                twitterToken.accessToken,
                //you can get it at dev.twitter.com for your own apps
                twitterToken.accessTokenSecret,
                //you can get it at dev.twitter.com for your own apps
                function (e, data, res) {
                    if (e) console.error(e);
                    else {
                        const result = JSON.parse(data);
                        const parsedResult = {url : restult.media_url}
                        };
                        resolve(parsedResult)
                    });
                });
    }


     function streamConnect(token, res) {
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
                                if(media.type=== "video"){
                                    //const url =getMediaKey(tweet.author_id, media.media_key);
                                    mongoDB.media.push({"id": media.media_key, "url": media.preview_image_url, type: media.type})
                                }
                                else{
                                    mongoDB.media.push({"id": media.media_key, "url": media.url, "type": media.type})
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
            catch
                (e)
                {
                    console.log("Twitter Heartbeat received")// Heartbeat received. Do nothing.
                }


        }).on('error', error => {
            console.log(error);
            if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                io.emit('timeout', true);
                stream.emit('timeout');
            }
        });

        return stream;
    }

    router.get("/getPlaceCoord/:placeId", async (req, res) => {
        const result= await getPlaceInformation(req.params.placeId);
        res.json(result)
    });

    router.get("/getUser/:id", async (req, res) => {
        const result= await getUserInformation(req.params.id);
        res.json(result)
    });

    router.post("/search",  async (req,res) => {

        const  q = req.body.filter;
        const bbox= req.body.bbox;
        const since= req.body.since;

        const result = await search(q,bbox,since);

        if(result.code === 500){
            res.status(500).send(result.error)
        }
        else if(result.code === 400){
            res.status(400).send(result.error)
        }
        else{
            res.json(result)
        }
    });

    router.post("/setStreamFilter", (req,res) => {

        const rules = [];
        if (bbox) {
            rules.push({"value" :  " bounding_box: [" + String(bbox.southWest.lng) + " " + String(bbox.southWest.lat) + " " + String(bbox.northEast.lng) + " " + String(bbox.northEast.lat) + "]"});
        }

    });

    router.get("/stream", async (req, res) => {
        let  currentRules;
        const rules = [
            {"value": "bounding_box: [-118.58230590820312 33.90119657968225 -118.24422607421875 34.14306652783193]"},
            {"value": "bounding_box: [13.270111083984375 52.46228526678029 13.493957519531248 52.56842095734828]"},
            ];

        /** try {
            // Gets the complete list of rules currently applied to the stream
            currentRules = await getAllRules(token);

            // Delete all rules. Comment this line if you want to keep your existing rules.
            await deleteAllRules(currentRules, token);

            // Add rules to the stream. Comment this line if you want to keep your existing rules.
            await setRules(rules, token);
        } catch (e) {
            console.error(e);
            process.exit(-1);
        }
         */

        await setRules(rules, token);

        // Listen to the stream.
        // This reconnection logic will attempt to reconnect when a disconnection is detected.
        // To avoid rate limites, this logic implements exponential backoff, so the wait time
        // will increase if the client cannot reconnect to the stream.

        const stream = streamConnect(token, res);
        let timeout = 0;
        stream.on('timeout', () => {
            // Reconnect on error
            console.log('A connection error occurred. Reconnecting…');
            setTimeout(() => {
                timeout++;
                streamConnect(token);
            }, 2 ** timeout);
        });
    });

    io.on('connection', function(socket) {
        console.log("user connected")
    });

    return router;}
