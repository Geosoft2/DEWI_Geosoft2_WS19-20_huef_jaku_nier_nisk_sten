// jshint esversion: 6
// jshint node: true
"use strict";

/**
* routes/api/v1/social/twitter/place/index.js
* @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const PlaceRouter = express.Router();

PlaceRouter.get('/:placeId', require('./twitterPlace').getPlaceCoord);


module.exports = PlaceRouter;
