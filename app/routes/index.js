// jshint esversion: 6
// jshint node: true
"use strict";

const express = require('express');
const Router = express.Router();

Router.get('/demo', require('./main').getDemoPage);
Router.get('/faq', require('./main').getFaq);
Router.get('/imprint', require('./main').getImprint);
Router.get('/', require('./main').getMainPage);



module.exports = Router;
