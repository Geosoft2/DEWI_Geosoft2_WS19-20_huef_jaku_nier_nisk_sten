// jshint esversion: 6
// jshint node: true
"use strict";

/**
*   routes/api/v1/weather/events/index.js
*   @description: index file for the events sub-application. All routes with '/events' come through here.
*   @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const EventsRouter = express.Router();

// Put route handels here;
EventsRouter.use('/dwd', require('./dwd'));

module.exports = EventsRouter;
