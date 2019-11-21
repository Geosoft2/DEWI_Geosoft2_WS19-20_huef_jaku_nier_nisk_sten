// jshint esversion: 8
// jshint node: true
"use strict";


// server uses port 3000
const port = 3000;

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');


function connectMongoDB() {
  (async () => {
    // set up default ("Docker") mongoose connection
    await mongoose.connect('mongodb://mongo/itemdb', {
      useNewUrlParser: true,
      useCreateIndex: true,
      autoReconnect: true
    }).then(db => {
      console.log('Connected to MongoDB (databasename: "'+db.connections[0].name+'") on host "'+db.connections[0].host+'" and on port "'+db.connections[0].port+'""');
    }).catch(async err => {
      console.log('Connection to '+'mongodb://mongo/itemdb'+' failed, try to connect to '+'mongodb://localhost:27017/itemdb');
      // set up "local" mongoose connection
      await mongoose.connect('mongodb://localhost:27017/itemdb', {
        useNewUrlParser: true,
        useCreateIndex: true,
        autoReconnect: true
      }).then(db => {
        console.log('Connected to MongoDB (databasename: "'+db.connections[0].name+'") on host "'+db.connections[0].host+'" and on port "'+db.connections[0].port+'""');
      }).catch(err2nd => {
        console.log('Error at MongoDB-connection with Docker: '+err);
        console.log('Error at MongoDB-connection with Localhost: '+err2nd);
        console.log('Retry to connect in 3 seconds');
        setTimeout(connectMongoDB, 3000); // retry until db-server is up
      });
    });
  })();
}

// connect to MongoDB
connectMongoDB();



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
app.use(cookieParser());

// set public folder
app.use(express.static(path.join(__dirname, 'public')));
// make packages available for client using statics
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/popper', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use("/leaflet", express.static(__dirname + "/node_modules/leaflet/dist"));
app.use("/leafletPan", express.static(__dirname + "/node_modules/leaflet.pancontrol/src"));
app.use("/leafletEasyButton", express.static(__dirname + "/node_modules/leaflet-easybutton/src"));
app.use("/fontAwesome", express.static(__dirname + "/node_modules/@fortawesome/fontawesome-free/"));


// setup routes
// @see https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491
require('./routes')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
