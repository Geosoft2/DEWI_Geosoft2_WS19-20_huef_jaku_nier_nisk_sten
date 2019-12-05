// jshint esversion: 6
// jshint node: true
"use strict";


const getMainPage = function(req, res){

  res.render('index', {
    title: 'Geosoftware 2',
  });
};



module.exports = {
  getMainPage
};
