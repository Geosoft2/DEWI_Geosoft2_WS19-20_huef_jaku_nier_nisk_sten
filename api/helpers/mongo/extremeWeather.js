// jshint esversion: 8
// jshint node: true
"use strict";

const ExtremeWeather = require('../../models/extremeWeather');
const moment = require('moment');
const {makeGeoJSonFromFeatures} = require('../geoJSON');
const io = require("../../helpers/socket-io").io;


const saveExtremeWeatherInMongo = async function(features, res){

  // only if data are available, data can be stored
  if(features){
    // console.log(moment());
    var now = moment();
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
        res.status(400).send({
          message: 'Error while storing data in MongoDB.'
        });
      }
    }
    var deletedEvent = await ExtremeWeather.deleteMany({_id: {$not: {$in: id}}});
    var stats = {
      new: newEvent,
      updated: updatedEvent,
      deleted:  deletedEvent.deletedCount
    };
    if(newEvent + deletedEvent.deletedCount > 0){
      io.emit('weatherchanges', {
        stats: stats
      });
    }
    res.status(200).send({
      message: 'Everything is updated or stored.',
      stats: stats
    });
  }
  else {
    await ExtremeWeather.deleteMany({});
    res.status(200).send({
      message: 'No data - nothing to store.'
    });
  }
};


const getExtremeWeatherFromMongo = async function(bboxPoylgon, events, minutes, res){
  console.log(events);
  try {
    var query = {};
    query.geometry = {$geoIntersects: {$geometry: {type: "Polygon", coordinates: [bboxPoylgon]}}};
    // optional search-parameter events
    if(events){
      // create a regular Expression to cover all possible combinations in 'EC_Group' (e.g.: FOG; FROST)
      var regExEvents = events.map(function(e){ return new RegExp(e, "i"); });
      query['properties.EC_GROUP'] = {$in: regExEvents};
    }
    // optional search-parameter minutes
    if(minutes){
      // ensures that only current data is output
      query.updatedAt = {$gt: moment().subtract(minutes, 'minutes')};
    }
    const result = await ExtremeWeather.find(query, {_id: 0}); //without _id (ObjectID)
    var geoJSON = makeGeoJSonFromFeatures(result);
    res.status(200).send({
      result: geoJSON
    });
  }
  catch(err){
    res.status(400).send({
      message: 'Error while getting extreme weather events.'
    });
  }
};



module.exports = {
  saveExtremeWeatherInMongo,
  getExtremeWeatherFromMongo
};
