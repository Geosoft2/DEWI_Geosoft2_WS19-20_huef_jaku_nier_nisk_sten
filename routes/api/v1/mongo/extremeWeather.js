// jshint esversion: 8
// jshint node: true
"use strict";

const ExtremeWeather = require('../../../../models/extremeWeather');


const postExtremeWeather = function(req, res){

  console.log(req.body);
  var features = req.body.features;

  for(var i = 0; i < features.length; i++){
    // asynchron?
    var newFeature = new ExtremeWeather({
      feature: features[i]
    });

    try{
      newFeature.save();
    }
    catch(err){
      console.log(err);
    }
  }
  res.status(200).send('Everything is stored.');
};


module.exports = {
  postExtremeWeather,
};
