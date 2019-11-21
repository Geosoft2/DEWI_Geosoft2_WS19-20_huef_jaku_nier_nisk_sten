// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

const ExtremeWeatherSchema = mongoose.Schema({
    feature: {
        type: mongoose.Mixed
    }
});

module.exports = mongoose.model('ExtremeWeather', ExtremeWeatherSchema);
