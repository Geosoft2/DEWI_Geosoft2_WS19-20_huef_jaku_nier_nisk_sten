// jshint esversion: 6
// jshint node: true
"use strict";

/**
*   routes/api/v1/social/twitter/index.js
*   @description: index file for the v1 sub-application. All routes with '/twitter' come through here.
*   @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const TwitterRouter = express.Router();

// Put route handels here;
TwitterRouter.use('/posts', require('./posts'));
TwitterRouter.use('/stream', require('./stream'));



module.exports = TwitterRouter;
