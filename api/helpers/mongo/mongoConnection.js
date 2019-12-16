// jshint esversion: 8
// jshint node: true
"use strict";

const mongoose = require('mongoose');
const chalk = require('chalk');

const mongoConnectionOption = {
  dbName: 'dewi',
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  //useUnifiedTopology: true,
  autoReconnect: true
};

const connectMongoDB = async function(cb) {
  // set up default ("Docker") mongoose connection
  await mongoose.connect('mongodb://mongo', mongoConnectionOption).then(db => {
    console.log(chalk.green('Connected to MongoDB (databasename: "'+db.connections[0].name+'") on host "'+db.connections[0].host+'" and on port "'+db.connections[0].port+'""'));
    cb();
  }).catch(async err => {
    console.log(chalk.red('Connection to '+'mongodb://mongo/'+mongoConnectionOption.dbName+' failed, try to connect to '+'mongodb://localhost:27017/'+mongoConnectionOption.dbName));
    // set up "local" mongoose connection
    await mongoose.connect('mongodb://localhost:27017', mongoConnectionOption).then(db => {
      console.log(chalk.green('Connected to MongoDB (databasename: "'+db.connections[0].name+'") on host "'+db.connections[0].host+'" and on port "'+db.connections[0].port+'""'));
      cb();
    }).catch(err2nd => {
      console.log(chalk.red('Error at MongoDB-connection with Docker: '+err));
      console.log(chalk.red('Error at MongoDB-connection with Localhost: '+err2nd));
      console.log(chalk.red('Retry to connect in 3 seconds'));
      setTimeout(connectMongoDB, 3000, cb); // retry until db-server is up
    });
  });
};

module.exports = {
  connectMongoDB
};
