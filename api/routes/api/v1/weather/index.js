// jshint esversion: 6
// jshint node: true
"use strict";

/**
*   routes/api/v1/weather/index.js
*   @description: index file for the weather sub-application. All routes with '/weather' come through here.
*   @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const WeatherRouter = express.Router();

// Put route handels here;
WeatherRouter.use('/events', require('./events'));

module.exports = WeatherRouter;
