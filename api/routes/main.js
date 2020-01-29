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
    'You can find a detailed reference at https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki/API-Specification',
    '',
    'Routes:',
    'POST  /api/v1/weather/events/dwd             Reference: https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki/API-Specification#21-get-extreme-weather-events',
    'POST  /api/v1/social/twitter/post            Reference: https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki/API-Specification#31-get-tweets',
    'POST  /api/v1/social/twitter/post/:postId    Reference: https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki/API-Specification#32-get-tweet',
    'PUT   /api/v1/demo                           Reference: https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki/API-Specification#41-put-demo'
  ];

  res.end(lines.join('\n'));
});

module.exports = MainRouter;
