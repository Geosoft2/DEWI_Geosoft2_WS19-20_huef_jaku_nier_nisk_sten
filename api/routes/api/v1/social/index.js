// jshint esversion: 6
// jshint node: true
"use strict";

/**
*   routes/api/v1/social/index.js
*   @description: index file for the social sub-application. All routes with '/social' come through here.
*   @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const SocialRouter = express.Router();

// Put route handels here;
SocialRouter.use('/twitter', require('./twitter'));

module.exports = SocialRouter;
