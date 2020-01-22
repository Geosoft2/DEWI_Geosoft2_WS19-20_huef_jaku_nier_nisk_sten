// jshint esversion: 6
// jshint node: true
"use strict";

/**
* routes/api/v1/demo/index.js
* @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
*/

const express = require('express');
const DemoRouter = express.Router();

DemoRouter.post('/', require('./demo').postDemo);

module.exports = DemoRouter;
