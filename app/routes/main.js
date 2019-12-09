// jshint esversion: 6
// jshint node: true
"use strict";


const getMainPage = function(req, res){
  var bbox = req.query.bbox;
  var events = req.query.events;
  var textfilter = req.query.textfilter;

  res.render('index', {
    title: 'DEWI',
    bbox: bbox,
    events: events,
    textfilter: textfilter
  });
};



module.exports = {
  getMainPage
};
