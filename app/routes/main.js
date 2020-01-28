// jshint esversion: 6
// jshint node: true
"use strict";

const {demoRequest} = require('../helpers/demo');
const {cookieExtractor} = require('../helpers/cookie');

const getMainPage = function(req, res){
  console.log('real');
  // application with real data

  var cookie = cookieExtractor(req,'acceptCookies');
  var bbox, events, textfilter;
  var error = [];

  if(req.query.bbox){
    //- longitute: max 180.0, min -180.0
    //- latitude: max 90.0, min -90.0
    var regExBbox = /^\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*,\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*$/;
    if(regExBbox.test(req.query.bbox)){
      bbox = req.query.bbox;
    }
    else{
      error.push(['The syntax of the given parameter "bbox" was wrong, therefore the default BBOX were queried initially.','/faq#ParameterBbox', 'More information', '.']);
    }
  }

  if(req.query.events){
    var regExEvents = /^\[(("[a-zA-Z]+")|(("[a-zA-Z]+"),)+("[a-zA-Z]+"))\]$/;
    if(regExEvents.test(req.query.events)){
      events = req.query.events;
    }
    else{
      error.push(['The syntax of the given parameter "events" was wrong, therefore the default events were queried initially.','/faq#ParameterEvents', 'More information', '.']);
    }
  }

  if(req.query.textfilter){
    var regExFilter = /^\[(("[^"']+")|(("[^"']+"),)+("[^"']+"))\]$/;
    if(regExFilter.test(req.query.textfilter)){
      textfilter = req.query.textfilter;
    }
    else{
      error.push(['The syntax of the given parameter "textfilter" was wrong, therefore the default text filter were queried initially.','/faq#ParameterTextFilter', 'More information', '.']);
    }
  }
  demoRequest(false, function(){
    res.render('index', {
      title: 'Home',
      bbox: bbox,
      events: events,
      textfilter: textfilter,
      host: process.env.API_HOST,
      cookie: cookie,
      errormessage: error
    });
  });
};


const getDemoPage = function(req, res){
  console.log('demo');
  // application with demo data

  var cookie = cookieExtractor(req,'acceptCookies');
  var bbox, events, textfilter;
  var error = [];

  if(req.query.bbox){
    //- longitute: max 180.0, min -180.0
    //- latitude: max 90.0, min -90.0
    var regExBbox = /^\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*,\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*$/;
    if(regExBbox.test(req.query.bbox)){
      bbox = req.query.bbox;
    }
    else{
      error.push(['The syntax of the given parameter "bbox" was wrong, therefore the default BBOX were queried initially.','/faq#ParameterBbox', 'More information', '.']);
    }
  }

  if(req.query.events){
    var regExEvents = /^\[(("[a-zA-Z]+")|(("[a-zA-Z]+"),)+("[a-zA-Z]+"))\]$/;
    if(regExEvents.test(req.query.events)){
      events = req.query.events;
    }
    else{
      error.push(['The syntax of the given parameter "events" was wrong, therefore the default events were queried initially.','/faq#ParameterEvents', 'More information', '.']);
    }
  }

  if(req.query.textfilter){
    var regExFilter = /^\[(("[^"']+")|(("[^"']+"),)+("[^"']+"))\]$/;
    if(regExFilter.test(req.query.textfilter)){
      textfilter = req.query.textfilter;
    }
    else{
      error.push(['The syntax of the given parameter "textfilter" was wrong, therefore the default text filter were queried initially.','/faq#ParameterTextFilter', 'More information', '.']);
    }
  }
  demoRequest(true, function(){
    res.render('index', {
      title: 'Demo',
      bbox: bbox,
      events: events,
      textfilter: textfilter,
      cookie: cookie,
      host: process.env.API_HOST,
      errormessage: error
    });
  });
};


const getFaq = function(req, res){
  res.render('faq', {
    title: 'FAQ'
  });
};

const getImprint = function(req, res){
  res.render('imprint', {
    title: 'Imprint'
  });
};


module.exports = {
  getMainPage,
  getDemoPage,
  getImprint,
  getFaq
};
