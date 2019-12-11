// jshint esversion: 8
// jshint node: true
"use strict";

const chalk = require('chalk');


const {
    getAllRules,
    deleteAllRules,
    setRules,
    setTwitterRules,
    streamConnect,
} = require('../../../../../../helpers/twitter/stream');


const setStreamFilter = async function (req, res){
    const rules = {bbox : req.body.bbox, keyword : req.body.keyword};
    setRules(rules);
    res.status(200).end()
};



const stream = async function (req, res){
    console.log(chalk.blue("Connecting to Twitter Stream"));
    let  currentRules;
    const rules = [
        {value: "place_country:DE"},
        //{value : "\"rain\" has:geo"}
        ];

     try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();
        // Delete all rules. Comment this line if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment this line if you want to keep your existing rules.
        await setTwitterRules(rules);
    } catch (e) {
        console.error(e);
        process.exit(-1);
    }

    // Listen to the stream.
    // This reconnection logic will attempt to reconnect when a disconnection is detected.

    let stream = streamConnect();
    stream.on('timeout', ()=>{
        console.log(chalk.blue('A connection error occurred. Reconnecting…'));
        loopStreamConnect();
    });
};

const loopStreamConnect = () => {
        console.log(chalk.blue('Next Connection try in 20 seconds'));
        setTimeout(() => {
            console.log(chalk.blue('New try to Connect'));
            let stream = streamConnect();
            stream.on('timeout', ()=>{
                console.log(chalk.blue('A connection error occurred. Reconnecting…'));
                loopStreamConnect();
            });
        }, 20000);
};



module.exports = {
  setStreamFilter,
  stream
};
