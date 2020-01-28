// jshint esversion: 8
// jshint node: true
"use strict";

const mongoose = require('mongoose');
const chalk = require('chalk');
const config = require('config-yml');

const mongoConnectionOption = {
    dbName: config.api.db.name,
    useNewUrlParser: config.api.db.options.useNewUrlParser,
    useFindAndModify: config.api.db.options.useFindAndModify,
    useCreateIndex: config.api.db.options.useCreateIndex,
    useUnifiedTopology: config.api.db.options.useUnifiedTopology,
    autoReconnect: config.api.db.options.autoReconnect
};

/**
 * @desc connects the MongoDB with docker-image or localhost
 * @param {function} cb callback, to execute something else afterwards
 */
const connectMongoDB = async function (cb) {
    // set up default ("Docker") mongoose connection
    await mongoose.connect('mongodb://' + config.api.db.docker.image, mongoConnectionOption).then(db => {
        console.log(chalk.green('Connected to MongoDB (databasename: "' + db.connections[0].name + '") on host "' + db.connections[0].host + '" and on port "' + db.connections[0].port + '""'));
        cb();
    }).catch(async err => {
        console.log(chalk.red('Connection to ' + 'mongodb://' + config.api.db.docker.image + '/' + mongoConnectionOption.dbName + ' failed, try to connect to ' + 'mongodb://' + config.api.db.local.host + ':' + config.api.db.local.port + '/' + mongoConnectionOption.dbName));
        // set up "local" mongoose connection
        await mongoose.connect('mongodb://' + config.api.db.local.host + ':' + config.api.db.local.port, mongoConnectionOption).then(db => {
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
