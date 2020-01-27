// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * routes/api/v1/social/twitter/stream.js
 * @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
 */

const express = require('express');
const StreamRouter = express.Router();

StreamRouter.get('/', require('./twitterStream').stream);


module.exports = StreamRouter;
