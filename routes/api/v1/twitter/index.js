// jshint esversion: 6
// jshint node: true
"use strict";

/**
* routes/api/v1/dwd/index.js
* @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const TwitterRouter = express.Router();

const twitterRoute= require('../twitter/twitter');

TwitterRouter.get("/getPlaceCoord/:placeId", require('./twitter').getPlaceCoord);

TwitterRouter.get("/getUser/:id", require('./twitter').getUser);

TwitterRouter.post("/search", require('./twitter').postSearch);

TwitterRouter.post("/setStreamFilter", require('./twitter').setStreamFilter);

TwitterRouter.get("/stream", require('./twitter').stream);



module.exports = TwitterRouter;
