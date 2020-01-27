// jshint esversion: 8
// jshint node: true
"use strict";

const chalk = require('chalk');


const {
    getAllRules,
    deleteAllRules,
    setTwitterRules,
    streamConnect,
} = require('../../../../../../helpers/twitter/stream');

const stream = async function (req, res) {

    let currentRules;
    const rules = [
        {value: "place_country:DE"},
    ];

    try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();
        // Delete all rules. Comment this line if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment this line if you want to keep your existing rules.
        await setTwitterRules(rules);
    } catch (e) {
        console.log(chalk.red('Twitter-Configuration is not complete respectively incorrect. More info:'));
        console.log(e);
        process.exit(-1);
    }

    // Listen to the stream.
    // This reconnection logic will attempt to reconnect when a disconnection is detected.

    let stream = streamConnect();
    console.log(chalk.blue("Connecting to Twitter Stream"));
    stream.on('timeout', () => {
        console.log(chalk.blue('A connection error occurred. Reconnecting…'));
        loopStreamConnect();
    });
};

const loopStreamConnect = () => {
    console.log(chalk.blue('Next Connection try in 20 seconds'));
    setTimeout(() => {
        console.log(chalk.blue('New try to Connect'));
        let stream = streamConnect();
        stream.on('timeout', () => {
            console.log(chalk.blue('A connection error occurred. Reconnecting…'));
            loopStreamConnect();
        });
    }, 20000);
};


module.exports = {
    stream
};
