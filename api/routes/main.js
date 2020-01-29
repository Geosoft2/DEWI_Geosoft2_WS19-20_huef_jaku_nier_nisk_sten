// jshint esversion: 6;
// jshint node: true
"use strict";

const express = require('express');
const MainRouter = express.Router();
const config = require('config-yml');

// Route to test the access of the API
MainRouter.get('/', function (req, res) {
  res.header('Content-Type', 'text/plain; charset=utf-8');

  const lines = [
    `This is the DEWI API.`, //running on
    `Version: 1.0`,
    'You can find a detailed reference at https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki/',
    '',
    'Routes:',
    'POST  /api/v1/weather/events/dwd             Reference:',
    'POST  /api/v1/social/twitter/post            Reference:',
    'POST  /api/v1/social/twitter/post/:postId    Reference:',
    'PUT   /api/v1/demo                           Reference:'
  ];

  res.end(lines.join('\n'));
});

module.exports = MainRouter;
