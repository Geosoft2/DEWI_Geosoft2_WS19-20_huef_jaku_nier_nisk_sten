// jshint esversion: 6
// jshint node: true
"use strict";

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

const bboxToPolygon = function(bbox){
  return [
   [parseFloat(bbox.southWest.lng), parseFloat(bbox.southWest.lat)],
   [parseFloat(bbox.northEast.lng), parseFloat(bbox.southWest.lat)],
   [parseFloat(bbox.northEast.lng), parseFloat(bbox.northEast.lat)],
   [parseFloat(bbox.southWest.lng), parseFloat(bbox.northEast.lat)],
   [parseFloat(bbox.southWest.lng), parseFloat(bbox.southWest.lat)]
 ];
};

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

module.exports = {
  makeGeoJSonFromFeatures,
  bboxToPolygon,
  isBbox
};
