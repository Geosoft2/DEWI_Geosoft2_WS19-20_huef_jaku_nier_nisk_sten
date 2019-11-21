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

TwitterRouter.use("/", twitterRoute());


module.exports = TwitterRouter;
