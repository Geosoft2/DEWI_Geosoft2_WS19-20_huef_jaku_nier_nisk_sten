// jshint esversion: 8
// jshint node: true
"use strict";

const ExtremeWeather = require('../../../../models/extremeWeather');
const {makeGeoJSonFromFeatures, bboxToPolygon} = require('../../../../helpers/geoJSON');
const io = require("../../../../helpers/socket-io").io;


const postExtremeWeather = async function(req, res){

  var features = req.body.features;
  // only if data are available, data can be stored
  if(features){
    var now = new Date(Date.now());
    var id = [];
    var newEvent = 0;
    var updatedEvent = 0;
    for(var i = 0; i < features.length; i++){
      try{
        var weather = await ExtremeWeather.findOneAndUpdate({
          type:features[i].type,
          'geometry.type': features[i].geometry.type,
          'geometry.coordinates': features[i].geometry.coordinates,
          properties: features[i].properties
        },{
          $set: {updatedAt: now},
          $setOnInsert: {createdAt: now}
        },{
          upsert: true,
          rawResult: true,
        });
        // updated document
        if(weather.lastErrorObject.updatedExisting){
          id.push(weather.value._id); // ObjectId
          updatedEvent += 1;
        }
        // new document
        else {
          id.push(weather.lastErrorObject.upserted); // ObjectId
          newEvent += 1;
        }
      }
      catch(err){
        console.log(err);
        res.status(400).send('Error while storing data in MongoDB.');
      }
    }
    var deleteWeather = await ExtremeWeather.deleteMany({_id: {$not: {$in: id}}});
    io.emit('test', {
      stats: {
        new: newEvent,
        updated: updatedEvent,
        deleted:  deleteWeather.deletedCount
      }
    });
    res.status(200).send({
      features: features.length,
      msg: 'Everything is updated or stored.',
      stats: {
        new: newEvent,
        updated: updatedEvent,
        deleted:  deleteWeather.deletedCount
      }
    });
  }
  else {
    await ExtremeWeather.deleteMany({});
    res.status(200).send('No data - nothing to store.');
  }
};


const getExtremeWeather = async function(req, res){
  var events = req.query.events || []; // output: ['FOG', 'FROST']
  var polygon = bboxToPolygon(req.query.bbox);
  try {
    // create a regular Expression to cover all possible combinations in 'EC_Group' (e.g.: FOG; FROST)
    var regExEvents = events.map(function(e){ return new RegExp(e, "i"); });
    const result = await ExtremeWeather.find({
      'properties.EC_GROUP': {$in: regExEvents},
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
