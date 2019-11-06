// jshint esversion: 6
// jshint node: true
"use strict";

const express = require('express');
const router = express.Router();
const OAuth2 = require('oauth').OAuth2;
var https = require("https");

const twitterToken = require('../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

var token = null;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});



router.get("/search", (req,res) => {

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

module.exports = router;
