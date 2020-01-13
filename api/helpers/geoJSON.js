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
  if(!bbox.northEast){
    return {error : 'bbox needs a northEast attribute. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(bbox.northEast.lat) !== "number"){
    return {error : 'northEast.lat must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(bbox.northEast.lng) !== "number"){
    return {error : 'northEast.lng must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(bbox.southWest.lat) !== "number"){
    return {error : 'southWest.lat must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(typeof(bbox.southWest.lng) !== "number"){
    return {error : 'southWest.lng must be a number. bbox Schema:  "bbox" : {' +
      '"southWest": {"lat": <double>, "lng": <double>}, ' +
      '"northEast": {"lat": <double>, "lng": <double>}' +
      '},'}
  }
  if(bbox.southWest.lat< bbox.northEast.lat){
    return {error: "southWest.lat must be higher tha nortEast.lat"}
  }
  if(bbox.southWest.lng< bbox.northEast.lng){
    return {error: "southWest.lng must be higher tha nortEast.lng"}
  }
  if(bbox.southWest.lat > 90 || bbox.southWest.lat < -90 || bbox.northEast.lat > 90 || bbox.northEast.lat < -90){
    return {error: "Latitude mus be betweet -90 and 90"}
  }
  if(bbox.southWest.lng > 180 || bbox.southWest.lng < -180 || bbox.northEast.lng > 180 || bbox.northEast.lng < -180){
    return {error: "Longitude mus be betweet -180 and 180"}
  }
  return true;
}


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
  isBbox,
  featureCollectionToMultiPolygon
};
