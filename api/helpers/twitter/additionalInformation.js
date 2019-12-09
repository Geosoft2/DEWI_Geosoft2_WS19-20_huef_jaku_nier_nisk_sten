"use strict";

/**
 * Returns information of an specified user
 * @param userId of the user
 * @returns <user infromation>
 */
const getUserInformation =  function(userData){
        const parsedResult = {"id": userData.id, "name": userData.name, "URL": "https://twitter.com/" + userData.username};
        return  parsedResult;
};


/**
 * Returns information about an specified place
 * @param placeId of the place
 *
 */
const getPlaceInformation = function(placeInformation){

    console.log(placeInformation)
                    const parsedResult = {
                        "name": placeInformation.full_name,
                        "coordinates": {
                            "lat": ((placeInformation.geo.bbox[1] + placeInformation.geo.bbox[3]) / 2),
                            "lng": ((placeInformation.geo.bbox[0] + placeInformation.geo.bbox[2])/ 2)
                        }
                    };
                    return parsedResult;
};

module.exports = {
    getUserInformation,
    getPlaceInformation,
};