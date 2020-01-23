// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * @desc creates a GeoJson from several single polygons.
 * @param {json} features (several) single polygons
 * @return {GeoJson}
 */
const makeGeoJSonFromFeatures = function(features){
  var featureArray = [];
  for(var i=0; i < features.length; i++){
    var feature = {
      type: features[i].type,
      geometry: features[i].geometry,
      properties: features[i].properties
    };
    featureArray.push(feature);
  }
  return {
    type: 'FeatureCollection',
    features: featureArray
  };
};


/**
 * @desc creates a polygon from a bbox as Json.
 * @param {json} bbox
 * @return {array} array with the coordinates from bbox
 */
const bboxToPolygon = function(bbox){
  return [
   [bbox.southWest.lng, bbox.southWest.lat],
   [bbox.northEast.lng, bbox.southWest.lat],
   [bbox.northEast.lng, bbox.northEast.lat],
   [bbox.southWest.lng, bbox.northEast.lat],
   [bbox.southWest.lng, bbox.southWest.lat]
 ];
};


/**
 * @desc creates a GeomtryCollection of MultiPolygons from a FeatureCollection of MultiPolygons
 * @see https://docs.mongodb.com/manual/reference/geojson/#geometrycollection
 * @param {geoJson} featureCollection
 * @return {geoJson} geometryCollection
 */
const featureCollectionToGeometryCollection = function(featureCollection){
  var geometryCollection = {
    type: "GeometryCollection",
    geometries: []
  };
  for(var feature in featureCollection.features){
    geometryCollection.geometries.push({
      type: "MultiPolygon",
      coordinates: featureCollection.features[feature].geometry.coordinates
    });
  }
  return geometryCollection;
};

// if request header "contentType" is not defined, numbers will be a string
// /**
//  * @desc converts string coordinates into float coordinates of a multidimensional array
//  * @param {array} coordinates mutidimensional array of "string"-coordinates
//  * @return {array} mutidimensional array of "float"-coordinates
//  */
// const multiCoordinatesStringToFloat = function(coordinates){
//   var coordinatesMulti = [];
//   for(var i = 0; i < coordinates[0].length; i++){
//     var coordinatesFloat = [];
//     for(var j = 0; j < coordinates[0][i].length; j++){
//         coordinatesFloat.push([parseFloat(coordinates[0][i][j][0]), parseFloat(coordinates[0][i][j][1])]);
//     }
//     coordinatesMulti.push(coordinatesFloat);
//   }
//   return coordinatesMulti;
// };

module.exports = {
  makeGeoJSonFromFeatures,
  bboxToPolygon,
  featureCollectionToGeometryCollection
};
