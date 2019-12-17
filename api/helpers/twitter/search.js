const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const https = require('https');

const twitterToken = require('../../../private/token.js').token.twitter_config;
const {postTweet, getTweetsFromMongo} = require('../mongo/tweets.js');

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

var token;

//create twitter access token
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});

/**
 * Returns the tweets found out by the sandbox search
 * @param filter after a keyword
 * @param area middle Point + Radius to filter tweets
 * @returns {Promise<tweets>}
 */
const sandboxSearch = function(filter, area) {

    /*
    var mongoFilter = ["ein", "und", "am", "bei"];
    var bbox = {
        southWest: {
            lat: 49.816,
            lng: 6.663
        },
        northEast: {
            lat: 52.261,
            lng: 9.701
        }
    };
    var mongoTweets = getTweetsFromMongo(mongoFilter, bbox);
*/


    return new Promise(function (resolve, reject) {

        //build the endpoint url
        let endpoint = 'https://api.twitter.com/1.1/search/tweets.json?count=1000&result_type=recent&enteties=true&q=';

        const q = filter;

        if (!q || typeof q !== "string") {
           // res.status(400).send("filter is a required Parameter and must be a string")
        } else {
            endpoint += q;
        }
        if(area){
            endpoint+="&geocode=" + area.center.lat +","+ area.center.lng + "," + area.radius + "km"
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

                    //transform the twitter Response in our specified mongoDB format
                    var twitterResponse = JSON.parse(body);
                    var mongoDBs = {tweets: []};
                    for (var tweet of twitterResponse.statuses) {
                        console.log(tweet);
                        if (tweet.geo || tweet.place) {
                            var mongoDB = {
                                tweetId: tweet.id_str,
                                "url": "https://twitter.com/i/status/" + tweet.id_str,
                                "text": tweet.text,
                                "createdAt": tweet.created_at,
                                "author": {
                                    "id": tweet.user.id,
                                    "name": tweet.user.name,
                                    "url": "https://twitter.com/" + tweet.user.screen_name,
                                    profileImage: tweet.user.profile_image_url
                                },
                                "media": [],
                                "places": {
                                    "coordinates": {"lat": null, "lng": null},
                                },
                            };
                            //check if media is embedded in the tweet
                            if (tweet.entities.media) {
                                for (var media of tweet.extended_entities.media) {
                                    mongoDB.media.push({"id": media.id, "url": media.media_url, type: media.type})
                                }
                            }
                            //proof if coordinates are specified in the tweet or just place information
                            if (tweet.geo) {
                                mongoDB.places.coordinates.lat = tweet.geo.coordinates[0];
                                mongoDB.places.coordinates.lng = tweet.geo.coordinates[1];
                            } else if (tweet.place) {
                                mongoDB.places.coordinates.lat = ((tweet.place.bounding_box.coordinates[0][0][1] + tweet.place.bounding_box.coordinates[0][1][1]) / 2);
                                mongoDB.places.coordinates.lng = ((tweet.place.bounding_box.coordinates[0][0][0] + tweet.place.bounding_box.coordinates[0][2][0]) / 2);
                                mongoDB.places.placeName = tweet.place.full_name;
                            }

                            console.log(mongoDB);
                            postTweet(mongoDB).then(r => console.log(r));

                            mongoDBs.tweets.push(mongoDB);
                        }
                    }

                    /*
                    console.log("Tweets from Mongo: ");
                    console.log(mongoTweets);
*/
                    resolve(mongoDBs);
                } catch (err) {
                    console.log(err);
                    resolve({error: err});
                }
            });

            httpResponse.on("error", (error) => {
                // JL().warn("Twitter Api not working" + error);
                return resolve({error: "Twitter Api is not working"});
            });
        });
    });
};

const mongoSearch = async function (filter, bbox) {
    var tweets = await getTweetsFromMongo(filter, bbox);
    console.log(tweets);
    return tweets;
}

/**
 * Performs the premium Search request
 * @param query keywords to filter
 * @param bbox a bbox to filter tweets
 * @param since the tweets are displayed
 * @returns {Promise<*>}
 */
const premiumSearch = async function(query, bbox, since) {

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
            endpoint += "&fromDate=" + twitterDateString;
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
                            tweetId: tweet.id_str,
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
                                mongoDB.media.push({"id": media.id, "url": media.media_url});
                            }
                        }
                        if (tweet.geo) {
                            mongoDB.places.coordinates.lat = tweet.geo.coordinates[1];
                            mongoDB.places.coordinates.lng = tweet.geo.coordinates[0];
                        } else if (tweet.place) {
                            mongoDB.places.coordinates.lat = ((tweet.place.bounding_box.coordinates[0][0][1] + tweet.place.bounding_box.coordinates[0][1][1]) / 2);
                            mongoDB.places.coordinates.lng = ((tweet.place.bounding_box.coordinates[0][0][0] + tweet.place.bounding_box.coordinates[0][2][0]) / 2);
                            mongoDB.places.placeName = tweet.place.full_name;
                        }

                        mongoDBs.tweets.push(mongoDB);

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

    });
};

module.exports = {
    premiumSearch,
    sandboxSearch,
    mongoSearch
};
