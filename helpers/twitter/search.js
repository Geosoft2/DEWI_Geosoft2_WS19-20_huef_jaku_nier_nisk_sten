const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;
const https = require('https');


const twitterToken = require('../../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

var token;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});

const sandboxSearch = function(filter, area) {

    return new Promise(function (resolve, reject) {
        let endpoint = 'https://api.twitter.com/1.1/search/tweets.json?count=1000&result_type=recent&q=';

        const q = filter;
        const bbox = area;

        /**if (!q || typeof q !== "string") {
            res.status(400).send("filter is a required Parameter and must be a string")
        } else {
            endpoint += q;
        }*/
        if(bbox){
            endpoint+="&geocode=" + String(bbox.coordinate.lat) +","+ String(bbox.coordinate.lng) + "," + String(bbox.area) + "km"
        };

        console.log(endpoint);

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

                    var tweetResoponse = [];
                    var mongoDBs = {tweets: []};
                    for (var tweet of twitterResponse.statuses) {
                        if (tweet.geo || tweet.place || tweet.coordinates) {
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
                                mongoDB.places.placeName = tweet.place.full_name;
                            }

                            mongoDBs.tweets.push(mongoDB)
                        }
                    }
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
    sandboxSearch
};

