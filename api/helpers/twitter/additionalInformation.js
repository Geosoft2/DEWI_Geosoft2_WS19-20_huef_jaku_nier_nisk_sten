// jshint esversion: 8
// jshint node: true
"use strict";

const turf = require("@turf/turf");
const config = require('config-yml');


/**
 * Returns information of an specified user
 * @param userData deliverd by the TwitterAPI
 * @returns <user infromation>
 */
const getUserInformation = function (userData) {
    return {
        "id": userData.id,
        "name": userData.name,
        "url": config.api.social.twitter.app.url.protocol+'://'+config.api.social.twitter.app.url.hostname + "/" + userData.username,
        profileImage: userData.profile_image_url
    };
};


/**
 * Returns specific information about an place, calculatest the accuracy
 * @param placeInformation deliverd by the TwitterAPI
 * @returns <place information>
 *
 */
const getPlaceInformation = function (placeInformation) {
    var line = turf.lineString([[placeInformation.geo.bbox[0], placeInformation.geo.bbox[1]], [placeInformation.geo.bbox[2], placeInformation.geo.bbox[3]]]);
    //accuracy:diagonal of the bbox divided by 2,
    //location: center of the bbox
    var accuracy = turf.length(line, {units: "meters"}) / 2;
    if (accuracy === 0) {
        accuracy += 1000;
    }
    return {
        "name": placeInformation.full_name,
        "bbox": placeInformation.geo.bbox,
        "accuracy": accuracy
    };
};

module.exports = {
    getUserInformation,
    getPlaceInformation
};
