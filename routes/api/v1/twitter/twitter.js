// jshint esversion: 8
// jshint node: true
"use strict";

const {
    premiumSearch,
    sandboxSearch,
} = require('../../../../helpers/twitter/search');

const {
    getAllRules,
    deleteAllRules,
    setRules,
    streamConnect,
} = require('../../../../helpers/twitter/stream');

const {
    getPlaceInformation,
    getUserInformation,
} = require('../../../../helpers/twitter/additionalInformation');

const {
    getRadii,
    bboxes
} = require('../../../../helpers/twitter/calculations');

const getPlaceCoord = async function (req, res){
// router.get("/getPlaceCoord/:placeId", async (req, res) => {
    const result= await getPlaceInformation(req.params.placeId);
    res.json(result);
};

const getUser = async function (req, res){
// router.get("/getUser/:id", async (req, res) => {
    const result= await getUserInformation(req.params.id);
    res.json(result);
};


const postSearch = async function (req, res){
// router.post("/search",  async (req,res) => {

    const  q = req.body.filter;
    const bbox= req.body.bbox;
    const since= req.body.since;

    const result = await premiumSearch(q,bbox,since);

    //Proof if request had an error
    if(result.code === 500){
        res.status(500).send(result.error);
    }
    else if(result.code === 400){
        res.status(400).send(result.error);
    }
    else{
        res.json(result);
    }
};

const postSandboxSearch = async function (req, res){
// router.post("/search",  async (req,res) => {

    const  q = req.body.filter;
    const bbox= req.body.bbox;

    const circles =getRadii(bbox);

    const result = {tweets: []};



    for (var circle of circles){
        const smallResult= await sandboxSearch(q,circle);
        if(result.code === 500){
            res.status(500).send(result.error);
        }
        else if(result.code === 400){
            res.status(400).send(result.error);
        }
        else {
            result.tweets = result.tweets.concat(smallResult.tweets);
        }
    }
        res.json(result);
};


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
        console.log(currentRules)

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
    // To avoid rate limites, this logic implements exponential backoff, so the wait time
    // will increase if the client cannot reconnect to the stream.

    let stream = streamConnect(20000);
    let timeout = 20000;
    stream.on('error', () => {
        // Reconnect on error
        console.log('Connection try Failed.');
        console.log('Next Reconnect in ' + timeout/1000 + "seconds");
        setTimeout(() => {
            timeout++;
            stream= streamConnect(timeout);
        }, 2 ** timeout);
    });
    stream.on('timeout', ()=>{
        console.log('A connection error occurred. Reconnecting…');
        streamConnect(timeout)
    })
};


module.exports = {
  getPlaceCoord,
  getUser,
  postSearch,
  setStreamFilter,
  stream,
  postSandboxSearch,
};