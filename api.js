// jshint esversion: 6
// jshint node: true
"use strict";


const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

var api = express();

api.use(express.json());
api.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
api.use(cookieParser());

api.use(cors());

// // set public folder
// app.use(express.static(path.join(__dirname, 'public')));
// // make packages available for client using statics
// app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
// app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
// app.use('/popper', express.static(__dirname + '/node_modules/popper.js/dist'));
// app.use("/leaflet", express.static(__dirname + "/node_modules/leaflet/dist"));
// app.use("/leafletPan", express.static(__dirname + "/node_modules/leaflet.pancontrol/src"));
// app.use("/leafletEasyButton", express.static(__dirname + "/node_modules/leaflet-easybutton/src"));
// app.use("/fontAwesome", express.static(__dirname + "/node_modules/@fortawesome/fontawesome-free/"));


// setup routes
// @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
require('./routes')(api);

// catch 404 and forward to error handler
api.use(function(req, res, next) {
  next(createError(404));
});

// error handler
api.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = api;
