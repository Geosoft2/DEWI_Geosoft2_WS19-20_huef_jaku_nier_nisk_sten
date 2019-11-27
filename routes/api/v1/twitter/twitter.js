// jshint esversion: 8
// jshint node: true
"use strict";

const express = require('express');
const router = express.Router();
const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;

const {
  getUserInformation,
  search,
  getPlaceInformation,
  getAllRules,
  deleteAllRules,
  setRules,
  getMediaKey,
  streamConnect
} = require('../../../../helpers/twitter');

const twitterToken = require('../../../../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

var token;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
    console.log(token);
});

const getPlaceCoord = async function (req, res){
// router.get("/getPlaceCoord/:placeId", async (req, res) => {
    const result= await getPlaceInformation(req.params.placeId);
    res.json(result);
};

const getUser = async function (req, res){
// router.get("/getUser/:id", async (req, res) => {
    const result= await getUserInformation(req.params.id);
    res.json(result);
};


const postSearch = async function (req, res){
// router.post("/search",  async (req,res) => {

    const  q = req.body.filter;
    const bbox= req.body.bbox;
    const since= req.body.since;

    const result = await search(q,bbox,since);

    if(result.code === 500){
        res.status(500).send(result.error);
    }
    else if(result.code === 400){
        res.status(400).send(result.error);
    }
    else{
        res.json(result);
    }
};


const setStreamFilter = function (req, res){
// router.post("/setStreamFilter", (req,res) => {
    var bbox = req.body.bbox;
    const rules = [];
    // if (bbox) {
    //     rules.push({"value" :  " bounding_box: [" + String(bbox.southWest.lng) + " " + String(bbox.southWest.lat) + " " + String(bbox.northEast.lng) + " " + String(bbox.northEast.lat) + "]"});
    // }
    var boboxes = bboxes(bbox);
    var circles = getRadii(bbox);
    for (var i in boboxes){
        rules.push({"value" :  " bounding_box: ["
                + String(boboxes[i].southWest.lng) + " "
                + String(boboxes[i].southWest.lat)  + " "
                + String(boboxes[i].northEast.lng) + " "
                + String(boboxes[i].northEast.lat) + "]"});
    }
    setRules(rules, token);4
};

/**
 * calculates an array of circles that covers the given bounding box
 * @param bbox
 * @returns {[]} array with circles that have a center (lat/lng) and a radius
 * */
function getRadii(bbox){
    var westOst= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.southWest.lat, bbox.northEast.lng));
    var nordSued= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.northEast.lat, bbox.southWest.lng));
    var westOstDiff= Math.ceil(westOst/35);
    var nordSuedDiff= Math.ceil(nordSued/35);
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
                    radius: mileToMeter(24.7485)

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


const stream = async function (req, res){
// router.get("/stream", async (req, res) => {
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
};


module.exports = {
  getPlaceCoord,
  getUser,
  postSearch,
  setStreamFilter,
  stream
};
