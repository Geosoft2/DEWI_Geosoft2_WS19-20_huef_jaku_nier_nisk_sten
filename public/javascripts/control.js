// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";
async function initial(){
    const bbox = getInitialBbox();
    const weatherResponse= await requestExtremeWeather(bbox);
    const circles= getRadii(bbox.bbox);
    for(var circle of circles){
        L.circle([circle.center.lat, circle.center.lng], {radius: circle.radius}).addTo(map);
    }
   const twitterResponse = await getTweets(bbox); //TODO: get the tweets from mongodb and not direct from Twitter

    addTweets(weatherResponse, twitterResponse.tweets);
}

/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
function getInitialBbox() {

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
            return(newDefaultBbox)
        } else {
            return(initialBbox);
        }

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
    const twitterResponse= await getTweets(bounds);
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

/**
 * calculates an array of circles that covers the given bounding box
 * @param bbox
 * @returns {[]} array with circles that have a center (lat/lng) and a radius
 * */
function getRadii(bbox){
    var westOst= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.southWest.lat, bbox.northEast.lng));
    var nordSued= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.northEast.lat, bbox.southWest.lng));
    var westOstDiff= Math.ceil(westOst/100);
    var nordSuedDiff= Math.ceil(nordSued/100);
    var boxes=[];
    var lngMultiplicator= (bbox.northEast.lng - bbox.southWest.lng)/westOstDiff;
    var latMultiplicator= (bbox.northEast.lat - bbox.southWest.lat)/nordSuedDiff;
    for (var i=0; i<(westOstDiff+1); i++){
        for (var j=0; j<(nordSuedDiff+1);j++){
            boxes.push(
                {center:{
                        lat:bbox.southWest.lat + j*latMultiplicator,
                        lng:bbox.southWest.lng + i*lngMultiplicator
                    },
                    radius: mileToMeter(65)

                }
            );
        }
    }
    return boxes;
}

/**
 * calculates an array of 25x25 boxes that cover the given bounding box
 * @param bbox
 * @returns {[]} array with boxes that have a southWest (lat/lng) and a northEast (lat/lng) corner
 */
function bboxes(bbox){
    var westOst= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.southWest.lat, bbox.northEast.lng));
    var nordSued= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.northEast.lat, bbox.southWest.lng));
    var westOstDiff= Math.ceil(westOst/25);
    var nordSuedDiff= Math.ceil(nordSued/25);
    var boxes=[];
    var lngMultiplicator= (bbox.northEast.lng - bbox.southWest.lng)/westOstDiff;
    var latMultiplicator= (bbox.northEast.lat - bbox.southWest.lat)/nordSuedDiff;
    for (var i=0; i<westOstDiff; i++){
        for (var j=0; j<nordSuedDiff;j++){
            boxes.push(
                {southWest:{
                        lat:bbox.southWest.lat + j*latMultiplicator,
                        lng:bbox.southWest.lng + i*lngMultiplicator
                    },
                    northEast:{
                        lat:bbox.southWest.lat + (j+1)*latMultiplicator,
                        lng:bbox.southWest.lng + (i+1)*lngMultiplicator
                    }
                }
            );
        }
    }
    return boxes;

}

function meterToMile(meter){
    return meter*0.0006213712;
}

function mileToMeter(mile) {
    return mile/0.0006213712;
}

function toRad(n) {
    return n * Math.PI / 180;
}

/**
 * calculates the distance between two points in meters
 * taken from https://gist.github.com/mathiasbynens/354587
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns {string|number} distance between the two points in meters
 */
function distVincenty(lat1, lon1, lat2, lon2) {
    var a = 6378137,
        b = 6356752.3142,
        f = 1 / 298.257223563, // WGS-84 ellipsoid params
        L = toRad(lon2-lon1),
        U1 = Math.atan((1 - f) * Math.tan(toRad(lat1))),
        U2 = Math.atan((1 - f) * Math.tan(toRad(lat2))),
        sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1),
        sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2),
        lambda = L,
        lambdaP,
        iterLimit = 100;
    do {
        var sinLambda = Math.sin(lambda),
            cosLambda = Math.cos(lambda),
            sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
        if (0 === sinSigma) {
            return 0; // co-incident points
        }
        var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda,
            sigma = Math.atan2(sinSigma, cosSigma),
            sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma,
            cosSqAlpha = 1 - sinAlpha * sinAlpha,
            cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha,
            C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        if (isNaN(cos2SigmaM)) {
            cos2SigmaM = 0; // equatorial line: cosSqAlpha = 0 (§6)
        }
        lambdaP = lambda;
        lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (!iterLimit) {
        return NaN; // formula failed to converge
    }

    var uSq = cosSqAlpha * (a * a - b * b) / (b * b),
        A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
        B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
        deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM))),
        s = b * A * (sigma - deltaSigma);
    return s.toFixed(3); // round to 1mm precision
}