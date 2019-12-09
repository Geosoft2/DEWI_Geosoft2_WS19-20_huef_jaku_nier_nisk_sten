// jshint esversion: 8
// jshint node: true
"use strict";


const {
    getAllRules,
    deleteAllRules,
    setRules,
    streamConnect,
} = require('../../../../../../helpers/twitter/stream');

const {
    getRadii,
    bboxes
} = require('../../../../../../helpers/twitter/calculations');



const setStreamFilter = async function (req, res){
// router.post("/setStreamFilter", (req,res) => {
    var bbox = req.body.bbox;
    const rules = [];
    // if (bbox) {
    //     rules.push({"value" :  " bounding_box: [" + String(bbox.southWest.lng) + " " + String(bbox.southWest.lat) + " " + String(bbox.northEast.lng) + " " + String(bbox.northEast.lat) + "]"});
    // }
    var boboxes = bboxes(bbox);
    var circles = getRadii(bbox);
    for (var i in boboxes){
        rules.push({"value" :  " bounding_box: ["
                + String(boboxes[i].southWest.lng) + " "
                + String(boboxes[i].southWest.lat)  + " "
                + String(boboxes[i].northEast.lng) + " "
                + String(boboxes[i].northEast.lat) + "]"});
    }
    try {
        // Gets the complete list of rules currently applied to the stream
        let currentRules = await getAllRules();

        // Delete all rules. Comment this line if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment this line if you want to keep your existing rules.
        await setRules(rules);
    } catch (e) {
        console.error(e);
        process.exit(-1);
    }
};



const stream = async function (req, res){
// router.get("/stream", async (req, res) => {
    let  currentRules;
    const rules = [
        {value: "bounding_box: [13.099822998046875 52.374760798535036 13.662872314453125 52.67221863915282]"},
        //{value : "\"rain\" has:geo"}
        ];

     try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();
        console.log(currentRules);

        // Delete all rules. Comment this line if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment this line if you want to keep your existing rules.
        await setRules(rules);
    } catch (e) {
        console.error(e);
        console.log("deleteRules");
        process.exit(-1);
    }

    // Listen to the stream.
    // This reconnection logic will attempt to reconnect when a disconnection is detected.

    let stream = streamConnect();
    stream.on('timeout', ()=>{
        console.log('A connection error occurred. Reconnecting…');
        loopStreamConnect();
    });
};

const loopStreamConnect = () => {
        console.log('Next Connection try in 20 seconds');
        setTimeout(() => {
            console.log('New try to Connect');
            let stream = streamConnect();
            stream.on('timeout', ()=>{
                console.log('A connection error occurred. Reconnecting…');
                loopStreamConnect();
            });
        }, 20000);
};


module.exports = {
  setStreamFilter,
  stream
};
