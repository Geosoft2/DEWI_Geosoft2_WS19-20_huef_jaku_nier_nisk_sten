// jshint esversion: 6
// jshint node: true
"use strict";

/**
*   routes/main/index.js
*   @description: index file for the main sub-application. All routes with '/' come through here.
*   @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const MainRouter = express.Router();

MainRouter.get('/', require('./main').getMainPage);


module.exports = MainRouter;
