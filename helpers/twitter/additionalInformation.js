"use strict";

const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const request = require('request');
const util = require('util');

const get = util.promisify(request.get);


const twitterToken = require('../../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

var token;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
    console.log(token);
});



var oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    twitterToken.consumerKey,
    twitterToken.consumerSecret,
    '1.0A',
    null,
    'HMAC-SHA1'
);




const getUserInformation = async function(userId){

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

        resolve(parsedResult);
    });

};





const getPlaceInformation = async function(placeId){

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
                    resolve(parsedResult);
                }
            });
    });
};

module.exports = {
    getUserInformation,
    getPlaceInformation,
};