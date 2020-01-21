// jshint esversion: 6
// jshint node: true
"use strict";

const {getRadarData} = require('../../../../../../helpers/weather/precipitation');

const getPrecipitation = function (req, res) {
    getRadarData("rw");
};

module.exports = {
    getPrecipitation
};