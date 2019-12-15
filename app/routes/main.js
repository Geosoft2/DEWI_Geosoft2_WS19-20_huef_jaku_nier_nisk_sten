// jshint esversion: 6
// jshint node: true
"use strict";


const getMainPage = function(req, res){
  var bbox, events;
  var textfilter = req.query.textfilter;
  var error = [];

  if(req.query.bbox){
    //- longitute: max 180.0, min -180.0
    //- latitude: max 90.0, min -90.0
    var regExBbox = /^\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*,\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*$/;
    if(regExBbox.test(req.query.bbox)){
      bbox = req.query.bbox;
    }
    else{
      error.push('The syntax of the given parameter "bbox" was wrong, therefore the default BBOX were queried initially. More information...');
    }
  }

  if(req.query.events){
    var regExEvents = /^\[(("[a-zA-Z]+")|(("[a-zA-Z]+"),)+("[a-zA-Z]+"))\]$/;
    if(regExEvents.test(req.query.events)){
    events = req.query.events;
    }
    else{
      error.push('The syntax of the given parameter "events" was wrong, therefore the default events were queried initially. More information...');
    }
  }

  res.render('index', {
    title: 'Home',
    bbox: bbox,
    events: events,
    textfilter: textfilter,
    errormessage: error
  });
};



module.exports = {
  getMainPage
};
