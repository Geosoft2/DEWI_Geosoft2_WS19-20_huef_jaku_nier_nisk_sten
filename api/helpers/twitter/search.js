const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const config = require('config-yml');
const twitterToken = require('../../private/token').token.twitter_config;
const {getTweetsFromMongo} = require('../mongo/tweets.js');

var oauth2 = new OAuth2(config.social.twitter.token.consumerKey, config.social.twitter.token.consumerSecret, config.social.twitter.api.url.protocol+'://'+config.social.twitter.api.url.hostname, null, config.social.twitter.api.url.path, null);

var token;

//create twitter access token
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});


/**
 * Requestst a Mongo DB search
 * @param {string} filter keyword to filter after
 * @param {json} bbox where the tweet must be in
 */
const mongoSearch = async function (filter, bbox, extremeWeatherEvents, id) {
    return await getTweetsFromMongo(filter, bbox, extremeWeatherEvents, id);
};

module.exports = {
    mongoSearch
};
