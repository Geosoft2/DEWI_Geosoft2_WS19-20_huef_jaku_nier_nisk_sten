"use strict";
const turf= require('@turf/turf');


/**
 * Returns information of an specified user
 * @param userData deliverd by the TwitterAPI
 * @returns <user infromation>
 */
const getUserInformation =  function(userData){
        const parsedResult = {"id": userData.id, "name": userData.name, "url": "https://twitter.com/" + userData.username, profileImage : userData.profile_image_url };
        return  parsedResult;
};


/**
 * Returns specific information about an place, calculatest the accuracy
 * @param placeInformation deliverd by the TwitterAPI
 * @returns <place information>
 *
 */
const getPlaceInformation = function(placeInformation){
                    var line = turf.lineString([[placeInformation.geo.bbox[0], placeInformation.geo.bbox[1]], [placeInformation.geo.bbox[2], placeInformation.geo.bbox[3]]]);
                    //accuracy:diagonal of the bbox divided by 2, 
                    //location: center of the bbox
                    var accuracy = turf.length(line, {units: 'meters'})/2;
                    if(accuracy == 0){ accuracy +=1000}
                    const parsedResult = {
                        "name": placeInformation.full_name,
                        "coordinates": {
                            "lat": ((placeInformation.geo.bbox[1] + placeInformation.geo.bbox[3]) / 2),
                            "lng": ((placeInformation.geo.bbox[0] + placeInformation.geo.bbox[2])/ 2)
                        },
                        accuracy: accuracy
                    };
                    return parsedResult;
};

module.exports = {
    getUserInformation,
    getPlaceInformation,
};