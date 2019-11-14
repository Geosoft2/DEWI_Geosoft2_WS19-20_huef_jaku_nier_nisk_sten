module.exports =  function(io) {
// jshint esversion: 6
// jshint node: true
    "use strict";

    const express = require('express');
    const router = express.Router();
    const OAuth2 = require('oauth').OAuth2;

    const twitterToken = require('../private/token.js').token.twitter_config;

    var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

    var token = null;
    oauth2.getOAuthAccessToken('', {
        'grant_type': 'client_credentials'
    }, function (e, access_token) {
        token = access_token;
    });




   /** router.get("/search", (req,res) => {

        var endpoint = 'https://api.twitter.com/1.1/search/tweets.json?q=rain';

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
                    return res.json(twitterResponse);
                }
                catch(err){
                    return res.status(500).send({error: "requestFailed"});
                }
            });

            httpResponse.on("error", (error) => {
                // JL().warn("Twitter Api not working" + error);
                res.status(500).send({error: "Twitter Api is not working"});
            });
        });
    });

    */



    const request = require('request');
    const util = require('util');

    const get = util.promisify(request.get);
    const post = util.promisify(request.post);


    const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');

    async function getUserInformation(userId){

        const url= "https://api.twitter.com/1.1/users/show.json?user_id=" + userId;
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

        const result= JSON.parse(response.body)
        const parsedResult= {"id" : result.id, "name": result.name, "URL": result.url}

        return parsedResult;

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


    function streamConnect(token, res) {
        // Listen to the stream
        const config = {
            url: 'https://api.twitter.com/labs/1/tweets/stream/filter?format=detailed',
            auth: {
                bearer: token,
            },
            timeout: 20000,
        };

        const stream = request.get(config);

        stream.on('data', data => {
            try {
                const json = JSON.parse(data);
                io.emit('tweet', json);
                console.log(json);
            } catch (e) {
                // Heartbeat received. Do nothing.
            }

        }).on('error', error => {
            console.log(error);
            if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                stream.emit('timeout');
            }
        });

        return stream;
    }

    router.get("/getUser/:id", async (req, res) => {
        const result= await getUserInformation(req.params.id);
        const parsedResult= {"id" : result.id, "name": result.name, "URL": result.url}
        res.json(p)
    });

    router.get("/stream", async (req, res) => {
        console.log('test');
        let  currentRules;
        const rules = [
            {"value": "bounding_box: [-118.58230590820312 33.90119657968225 -118.24422607421875 34.14306652783193]"},
            {"value": "bounding_box: [13.270111083984375 52.46228526678029 13.493957519531248 52.56842095734828]"},
            ]
        ;

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
            streamConnect(token);
        });
    });

    io.on('connection', function(socket) {
        console.log("user connected")
    });

    return router;}
