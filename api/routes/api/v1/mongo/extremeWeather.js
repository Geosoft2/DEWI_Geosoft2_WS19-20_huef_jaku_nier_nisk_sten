// jshint esversion: 8
// jshint node: true
"use strict";

const ExtremeWeather = require('../../../../models/extremeWeather');
const {makeGeoJSonFromFeatures, bboxToPolygon} = require('../../../../helpers/geoJSON');


const postExtremeWeather = async function(req, res){
  try{
    await ExtremeWeather.deleteMany({});
  }
  catch(err){
    console.log(err);
    res.status(400).send('Error while deleting data in MongoDB.');
  }
  var features = req.body.features;
  // only if data are available, data can be stored
  if(features){
    for(var i = 0; i < features.length; i++){
      var newFeature = new ExtremeWeather({
        type: features[i].type,
        geometry: features[i].geometry,
        properties: features[i].properties
      });
      try{
        // asynchron?
        await newFeature.save();
      }
      catch(err){
        console.log(err);
        res.status(400).send('Error while storing data in MongoDB.');
      }
    }
    res.status(200).send('Everything is stored.');
  }
  else {
    res.status(200).send('Nothing to store.');
  }
};


const getExtremeWeather = async function(req, res){
  var events = req.query.events || []; // output: ['FOG', 'FROST']
  var polygon = bboxToPolygon(req.query.bbox);
  try {
    const result = await ExtremeWeather.find({
      'properties.EC_GROUP': {$in: events},
      geometry: {$geoIntersects: {$geometry: {type: "Polygon", coordinates: [polygon]}}}
    }, {_id: 0}); //without _id (ObjectID)
    var geoJSON = makeGeoJSonFromFeatures(result);
    // console.log(result);
    res.status(200).send(geoJSON);
  }
  catch(err){
    res.status(400).send('Error while getting extreme weather events from MongoDB.');
  }
};



module.exports = {
  postExtremeWeather,
  getExtremeWeather
};
