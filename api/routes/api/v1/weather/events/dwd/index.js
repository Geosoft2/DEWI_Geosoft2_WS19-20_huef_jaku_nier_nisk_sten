// jshint esversion: 6
// jshint node: true
"use strict";

/**
* routes/api/v1/weather/events/dwd/index.js
* @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const DWDRouter = express.Router();

DWDRouter.post('/', require('./extremeWeather').getExtremeWeather);

module.exports = DWDRouter;
