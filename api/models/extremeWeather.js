// jshint esversion: 6
// jshint node: true
"use strict";

const mongoose = require('mongoose');

const ExtremeWeatherSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['Feature'],
    default: 'Feature',
    required: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['MultiPolygon'],
      default: 'MultiPolygon'
    },
    coordinates: {
      type: [[[[Number]]]],
    }
  },
  properties: {
    type: mongoose.Mixed
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date,
    required: true
  }
});
// },{
//   // this will automatically add "createdAt" and "updatedAt" fields to the schema.
//   timestamps: true
// });


// ExtremeWeatherSchema.index({geometry: '2dsphere'});

module.exports = mongoose.model('ExtremeWeather', ExtremeWeatherSchema);
