// jshint esversion: 8
// jshint node: true
"use strict";

const mongoose = require('mongoose');
const chalk = require('chalk');
const config = require('config-yml');

const mongoConnectionOption = {
    dbName: config.db.name,
    useNewUrlParser: config.db.options.useNewUrlParser,
    useFindAndModify: config.db.options.useFindAndModify,
    useCreateIndex: config.db.options.useCreateIndex,
    //useUnifiedTopology: config.db.options.useUnifiedTopology,
    autoReconnect: config.db.options.autoReconnect
};

/**
 * @desc connects the MongoDB with docker-image or localhost
 * @param {function} cb callback, to execute something else afterwards
 */
const connectMongoDB = async function (cb) {
    // set up default ("Docker") mongoose connection
    await mongoose.connect('mongodb://' + config.db.docker.image, mongoConnectionOption).then(db => {
        console.log(chalk.green('Connected to MongoDB (databasename: "' + db.connections[0].name + '") on host "' + db.connections[0].host + '" and on port "' + db.connections[0].port + '""'));
        cb();
    }).catch(async err => {
        console.log(chalk.red('Connection to ' + 'mongodb://' + config.db.docker.image + '/' + mongoConnectionOption.dbName + ' failed, try to connect to ' + 'mongodb://' + config.db.local.host + ':' + config.db.local.port + '/' + mongoConnectionOption.dbName));
        // set up "local" mongoose connection
        await mongoose.connect('mongodb://' + config.db.local.host + ':' + config.db.local.port, mongoConnectionOption).then(db => {
            console.log(chalk.green('Connected to MongoDB (databasename: "' + db.connections[0].name + '") on host "' + db.connections[0].host + '" and on port "' + db.connections[0].port + '""'));
            cb();
        }).catch(err2nd => {
            console.log(chalk.red('Error at MongoDB-connection with Docker: ' + err));
            console.log(chalk.red('Error at MongoDB-connection with Localhost: ' + err2nd));
            console.log(chalk.red('Retry to connect in 3 seconds'));
            setTimeout(connectMongoDB, 3000, cb); // retry until db-server is up
        });
    });
};

module.exports = {
    connectMongoDB
};
