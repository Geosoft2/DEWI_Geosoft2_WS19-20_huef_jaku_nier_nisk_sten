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
 * Proofs if the bbox is a valid bbox
 * @param {*} bbox
 * @returns {boolean}
 */
const isBbox = function(bbox){
  if(!bbox.southWest){
    return {error : 'bbox needs a southWest attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(!bbox.southWest.lat){
    return {error : 'bbox needs a southWest.lat attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(!bbox.southWest.lng){
    return {error : 'bbox needs a southWest.lng attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(!bbox.northEast){
    return {error : 'bbox needs a northEast attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(!bbox.northEast.lat){
    return {error : 'bbox needs a northEast.lat attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(!bbox.northEast.lng){
    return {error : 'bbox needs a northEast.lng attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(Number(bbox.northEast.lat)) !== "number"){
    return {error : 'northEast.lat must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(Number(bbox.northEast.lng)) !== "number"){
    return {error : 'northEast.lng must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(Number(bbox.southWest.lat)) !== "number"){
    return {error : 'southWest.lat must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(Number(bbox.southWest.lng)) !== "number"){
    return {error : 'southWest.lng must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(Number(bbox.southWest.lat) > Number(bbox.northEast.lat)){
    return {error: "southWest.lat must be lower than northEast.lat"}
  }
  if(Number(bbox.southWest.lng) > Number(bbox.northEast.lng)){
    return {error: "southWest.lng must be lower than northEast.lng"}
  }
  if(Number(bbox.southWest.lat) > 90 || Number(bbox.southWest.lat) < -90 || Number(bbox.northEast.lat) > 90 || Number(bbox.northEast.lat) < -90){
    return {error: "Latitude mus be betweet -90 and 90"}
  }
  if(Number(bbox.southWest.lng) > 180 || Number(bbox.southWest.lng) < -180 || Number(bbox.northEast.lng) > 180 || Number(bbox.northEast.lng) < -180){
    return {error: "Longitude mus be betweet -180 and 180"}
  }
  return true;
}


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
    var coordinatesFloat = multiCoordinatesStringToFloat(featureCollection.features[feature].geometry.coordinates);
    geometryCollection.geometries.push({
      type: "MultiPolygon",
      coordinates: [coordinatesFloat]
    });
  }
  return geometryCollection;
};


/**
 * @desc converts string coordinates into float coordinates of a multidimensional array
 * @param {array} coordinates mutidimensional array of "string"-coordinates
 * @return {array} mutidimensional array of "float"-coordinates
 */
const multiCoordinatesStringToFloat = function(coordinates){
  var coordinatesMulti = [];
  for(var i = 0; i < coordinates[0].length; i++){
    var coordinatesFloat = [];
    for(var j = 0; j < coordinates[0][i].length; j++){
        coordinatesFloat.push([parseFloat(coordinates[0][i][j][0]), parseFloat(coordinates[0][i][j][1])]);
    }
    coordinatesMulti.push(coordinatesFloat);
  }
  return coordinatesMulti;
};

module.exports = {
  makeGeoJSonFromFeatures,
  bboxToPolygon,
  isBbox,
  featureCollectionToGeometryCollection
};
