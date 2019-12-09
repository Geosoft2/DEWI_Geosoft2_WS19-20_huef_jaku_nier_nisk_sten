// jshint esversion: 8
// jshint node: true
"use strict";

const chalk = require('chalk');

const {
    premiumSearch,
    sandboxSearch,
} = require('../../../../helpers/twitter/search');

const {
    getAllRules,
    deleteAllRules,
    setRules,
    setTwitterRules,
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

    if(!bbox){
        req.status(404).send("bbox is required")
    }

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
  getPlaceCoord,
  getUser,
  postSearch,
  setStreamFilter,
  stream,
  postSandboxSearch,
};
