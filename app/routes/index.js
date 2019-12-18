// jshint esversion: 6
// jshint node: true
"use strict";

const express = require('express');
const Router = express.Router();

Router.get('/', require('./main').getMainPage);
Router.get('/faq', require('./main').getFaq);
Router.get('/imprint', require('./main').getImprint);


module.exports = Router;
