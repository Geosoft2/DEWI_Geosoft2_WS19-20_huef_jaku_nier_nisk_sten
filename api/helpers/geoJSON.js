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
    featureArray.push(features[i]);
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
   [parseFloat(bbox.southWest.lng), parseFloat(bbox.southWest.lat)],
   [parseFloat(bbox.northEast.lng), parseFloat(bbox.southWest.lat)],
   [parseFloat(bbox.northEast.lng), parseFloat(bbox.northEast.lat)],
   [parseFloat(bbox.southWest.lng), parseFloat(bbox.northEast.lat)],
   [parseFloat(bbox.southWest.lng), parseFloat(bbox.southWest.lat)]
 ];
};


/**
 * @desc creates a MultiPolygon from a FeatureCollection
 * @see https://docs.mongodb.com/manual/reference/geojson/#multipolygon
 * @param {geoJson} featureCollection
 * @return {geoJson} MultiPolygon
 */
const featureCollectionToMultiPolygon = function(featureCollection){
  var multiPolygon = {
    type: "MultiPolygon"
  };
  var coordinates = [];
  for(var feature in featureCollection.features){
    var coordinatesFloat = coordinatesStringToFloat(featureCollection.features[feature].geometry.coordinates);
    coordinates.push([coordinatesFloat]);
  }
  multiPolygon.coordinates = coordinates;
  return multiPolygon;
};


const coordinatesStringToFloat = function(coordinates){
  var coordinatesFloat = [];
  for(var i = 0; i < coordinates[0][0].length; i++){
    coordinatesFloat.push([parseFloat(coordinates[0][0][i][0]), parseFloat(coordinates[0][0][i][1])]);
  }
  return coordinatesFloat;
};

module.exports = {
  makeGeoJSonFromFeatures,
  bboxToPolygon,
  featureCollectionToMultiPolygon
};
