// jshint esversion: 6
// jshint node: true
"use strict";

/**
* routes/api/v1/dwd/index.js
* @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const MongoRouter = express.Router();

MongoRouter.post('/extremeWeather', require('./extremeWeather').postExtremeWeather);


module.exports = MongoRouter;
