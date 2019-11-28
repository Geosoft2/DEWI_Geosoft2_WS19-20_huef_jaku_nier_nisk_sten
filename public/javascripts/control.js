// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";
async function initial(){
    const weatherResponse = await initialExtremeWeather();
    const twitterResponse = await getTweets(); //TODO: get the tweets from mongodb and not direct from Twitter
    addTweets(weatherResponse, twitterResponse);
}

/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
function initialExtremeWeather() {

    return new Promise(async function (resolve, reject) {
        // initial bounding box with the area of germany
        var initialBbox = {
            bbox: {
                southWest: {
                    lat: 47.2704, // southWest.lng
                    lng: 6.6553 // southWest.lat
                },
                northEast: {
                    lat: 55.0444, // northEast.lng
                    lng: 15.0176 // southWest.lat
                }
            }
        };

        bounds=initialBbox;

        // get the new default boundingbox
        var newDefaultBbox = getCookie("defaultBbox");

        // if there is a boundingbox defined by the user it is used, if not the initial bounding box is used
        if (newDefaultBbox != "") {

            newDefaultBbox = JSON.parse(newDefaultBbox);
            bounds=newDefaultBbox;

            var northEastLat = newDefaultBbox.bbox.northEast.lat;
            var northEastLng = newDefaultBbox.bbox.northEast.lng;
            var southWestLat = newDefaultBbox.bbox.southWest.lat;
            var southWestLng = newDefaultBbox.bbox.southWest.lng;

            map.fitBounds([[northEastLat, northEastLng], [southWestLat, southWestLng]])
        } else {
            const wfsLayer= await requestExtremeWeather(initialBbox);
            resolve(wfsLayer)
        }
    })

}

map.on('moveend', function (e) {
    // function which is triggered automatically when the map gets moved
    bounds = map.getBounds();
    bounds = boundingbox(bounds);
    mapExtendChange(bounds);
});

/**
 * @desc new extreme weather data are loaded after each change of map-extent
 * @param {json} bounds coordinates of current map-extent
 */
async function mapExtendChange(bounds) {
    // TODO: setTweets("array of tweets");
    // TODO: uncomment updateTwitterStream after setStreamfilter works
    //await updateTwitterStream(bbox.bbox);
    const wfsLayer= await requestExtremeWeather(bounds);
    const twitterResponse= await getTweets();
    addTweets(wfsLayer, twitterResponse)
}

/**
 * @desc function for requesting a cookie which was stored before
 * @param cname name of the cookie
 * @returns {string}
 * @source https://www.w3schools.com/js/js_cookies.asp
 */
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}