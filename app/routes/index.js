// jshint esversion: 6
// jshint node: true
"use strict";

const express = require('express');
const Router = express.Router();

Router.get('/', require('./main').getMainPage);


module.exports = Router;
