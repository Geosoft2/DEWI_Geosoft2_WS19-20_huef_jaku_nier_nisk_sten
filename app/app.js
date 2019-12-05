// jshint esversion: 6
// jshint node: true
"use strict";


const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

var app = express();

//reads configuration from a .env file
require('dotenv').config();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// set public folder
app.use(express.static(path.join(__dirname, 'public')));
// make packages available for client using statics
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/popper', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use("/leaflet", express.static(__dirname + "/node_modules/leaflet/dist"));
app.use("/leafletPan", express.static(__dirname + "/node_modules/leaflet.pancontrol/src"));
app.use("/leafletEasyButton", express.static(__dirname + "/node_modules/leaflet-easybutton/src"));
app.use("/fontAwesome", express.static(__dirname + "/node_modules/@fortawesome/fontawesome-free/"));
app.use("/leafletControlWindow", express.static(__dirname + "/node_modules/leaflet-control-window/src"));
app.use("/leafletControlCustom", express.static(__dirname + "/node_modules/leaflet-control-custom/"));
app.use("/bootstrapSelect", express.static(__dirname + "/node_modules/bootstrap-select/"));

// setup routes
app.use('/', require('./routes'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
