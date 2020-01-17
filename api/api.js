// jshint esversion: 6
// jshint node: true
"use strict";


const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

var addRequestId = require('express-request-id')();

var api = express();

api.use("/logo", express.static(__dirname + "/logo/"));
api.use(express.json());
api.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
api.use(cookieParser());
api.use(addRequestId);
api.use(cors());

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
  res.send(err);
});

module.exports = api;
