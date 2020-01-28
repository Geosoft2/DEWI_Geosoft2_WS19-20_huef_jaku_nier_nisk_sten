// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * Proofs if the geojson is a valid MultiPolygon-FeatureCollection
 * @param {*} geojson
 * @param {String} parametername
 * @returns {boolean}
 */
const multiPolygonFeatureCollectionValid = function (geojson, parametername) {
    if (!geojson.type) {
        return {
            error: 'Parameter \'' + parametername + '\' needs a type attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
        };
    }
    if (geojson.type !== 'FeatureCollection') {
        return {
            error: 'Parameter \'' + parametername + '.type\' needs to be a FeatureCollection. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
        };
    }
    if (!geojson.features) {
        return {
            error: 'Parameter \'' + parametername + '\' needs a features attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
        };
    }
    if (!Array.isArray(geojson.features)) {
        return {
            error: 'Parameter \'' + parametername + '.features\' must be an array. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
        };
    }
    for (var i = 0; i < geojson.features.length; i++) {
        // https://tools.ietf.org/html/rfc7946#section-3.2
        if (!geojson.features[i].type) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + ']\' needs a type attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (geojson.features[i].type !== 'Feature') {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].type\' needs to be a Feature. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        // https://tools.ietf.org/html/rfc7946#section-3.2
        if (!geojson.features[i].properties && geojson.features[i].properties !== null) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + ']\' needs a properties attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        try {
            JSON.parse('"' + geojson.features[i].properties + '"');
        } catch (err) {
            console.log(err);
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].properties\' must be a valid Json. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (!geojson.features[i].geometry) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + ']\' needs a geometry attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (!geojson.features[i].geometry.type) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].geometry\' needs a type attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (geojson.features[i].geometry.type !== 'MultiPolygon') {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.type\' needs to be a MultiPolygon. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (!geojson.features[i].geometry.coordinates) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].geometry\' needs a  coordinates attribute. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (!Array.isArray(geojson.features[i].geometry.coordinates)) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates\' must be an array. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        if (geojson.features[i].geometry.coordinates.length !== 1) {
            return {
                error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates\' must be not an empty array. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                    '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
            };
        }
        for (var j = 0; j < geojson.features[i].geometry.coordinates.length; j++) {
            if (!Array.isArray(geojson.features[i].geometry.coordinates[j])) {
                return {
                    error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + ']\' must be an array. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                        '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                };
            }
            if (geojson.features[i].geometry.coordinates[j].length < 1) {
                return {
                    error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + ']\': a MultiPolygon consists of at least one Polygon. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                        '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                };
            }
            for (var k = 0; k < geojson.features[i].geometry.coordinates[j].length; k++) {
                if (!Array.isArray(geojson.features[i].geometry.coordinates[j][k])) {
                    return {
                        error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + ']\' must be an array. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                            '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                    };
                }
                if (geojson.features[i].geometry.coordinates[j][k].length < 4) {
                    return {
                        error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + ']\': a Polygon consists of at least four coordinates. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                            '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                    };
                }

                for (var l = 0; l < geojson.features[i].geometry.coordinates[j][k].length; l++) {
                    if (!Array.isArray(geojson.features[i].geometry.coordinates[j][k][l])) {
                        return {
                            error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + '][' + l + ']\' must be an array. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                        };
                    }
                    if (geojson.features[i].geometry.coordinates[j][k][l].length !== 2) {
                        return {
                            error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + '][' + l + ']\' length must be 2. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                        };
                    }
                    if (typeof (geojson.features[i].geometry.coordinates[j][k][l][0]) !== 'number') {
                        return {
                            error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + '][' + l + '][0]\' must be a number. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                        };
                    }
                    if (geojson.features[i].geometry.coordinates[j][k][l][0] > 180 || geojson.features[i].geometry.coordinates[j][k][l][0] < -180) {
                        return {
                            error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + '][' + l + '][0]:\' Longitude must be between -180 and 180. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                        };
                    }
                    if (typeof (geojson.features[i].geometry.coordinates[j][k][l][1]) !== 'number') {
                        return {
                            error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + '][' + l + '][1]\' must be a number. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<latitude>, <longitude>]]]]}, \'properties\': {}}]}'
                        };
                    }
                    if (geojson.features[i].geometry.coordinates[j][k][l][1] > 90 || geojson.features[i].geometry.coordinates[j][k][l][0] < -90) {
                        return {
                            error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + '][' + l + '][0]:\' Latitude must be between -90 and 90. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                                '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                        };
                    }
                }
                if (geojson.features[i].geometry.coordinates[j][k][0].toString() !== geojson.features[i].geometry.coordinates[j][k][geojson.features[i].geometry.coordinates[j][k].length - 1].toString()) {
                    return {
                        error: 'Parameter \'' + parametername + '.features[' + i + '].geometry.coordinates[' + j + '][' + k + ']\': a polygon must be closed. ' + parametername + ' Schema: {\'type\': \'FeatureCollection\', ' +
                            '\'features\': [{\'type\': \'Feature\', \'geometry\': {\'type\': \'MultiPolygon\', \'coordinates\': [[[[<longitude>, <latitude>]]]]}, \'properties\': {}}]}'
                    };
                }
            }
        }
    }
    return true;
};


module.exports = {
    multiPolygonFeatureCollectionValid
};
