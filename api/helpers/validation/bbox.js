// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * Proofs if the bbox is a valid bbox
 * @param {*} bbox
 * @returns {boolean}
 */
const bboxValid = function(bbox){
  if(!bbox.southWest){
    return {error : 'Parameter \'bbox\' needs a southWest attribute. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(!bbox.southWest.lat && bbox.southWest.lat !== 0){
    return {error : 'Parameter \'bbox\' needs a southWest.lat attribute. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(!bbox.southWest.lng && bbox.southWest.lng !== 0){
    return {error : 'Parameter \'bbox\' needs a southWest.lng attribute. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(!bbox.northEast){
    return {error : 'Parameter \'bbox\' needs a northEast attribute. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(!bbox.northEast.lat && bbox.northEast.lat !== 0){
    return {error : 'Parameter \'bbox\' needs a northEast.lat attribute. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(!bbox.northEast.lng && bbox.northEast.lng !== 0){
    return {error : 'Parameter \'bbox\' needs a northEast.lng attribute. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(typeof(bbox.northEast.lat) !== 'number'){
    return {error : 'Parameter \'bbox\': northEast.lat must be a number. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(typeof(bbox.northEast.lng) !== 'number'){
    return {error : 'Parameter \'bbox\': northEast.lng must be a number. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(typeof(bbox.southWest.lat) !== 'number'){
    return {error : 'Parameter \'bbox\': southWest.lat must be a number. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(typeof(bbox.southWest.lng) !== 'number'){
    return {error : 'Parameter \'bbox\': southWest.lng must be a number. bbox Schema: {\'bbox\' : {' +
      '\'southWest\': {\'lat\': <double>, \'lng\': <double>}, ' +
      '\'northEast\': {\'lat\': <double>, \'lng\': <double>}' +
      '}}'};
  }
  if(bbox.southWest.lat >= bbox.northEast.lat){
    return {error: "Parameter \'bbox\': southWest.lat must be lower than northEast.lat"};
  }
  if(bbox.southWest.lng >= bbox.northEast.lng){
    return {error: "Parameter \'bbox\': southWest.lng must be lower than northEast.lng"};
  }
  if(bbox.southWest.lat > 90 || bbox.southWest.lat < -90 || bbox.northEast.lat > 90 || bbox.northEast.lat < -90){
    return {error: "Parameter \'bbox\': Latitude must be between -90 and 90"};
  }
  if(bbox.southWest.lng > 180 || bbox.southWest.lng < -180 || bbox.northEast.lng > 180 || bbox.northEast.lng < -180){
    return {error: "Parameter \'bbox\': Longitude must be between -180 and 180"};
  }
  return true;
};

module.exports = {
  bboxValid
};
