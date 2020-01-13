// jshint esversion: 8
// jshint node: true
"use strict";

const {
    sandboxSearch,
    mongoSearch
} = require('../../../../../../helpers/twitter/search');


const {
    getRadii,
} = require('../../../../../../helpers/twitter/calculations');



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

const postMongoSearch = async function (req, res) {
    const filter = req.body.filter;
    const bbox= req.body.bbox;
    const extremeWeatherEvents = req.body.extremeWeatherEvents;
    const createdAt = req.body.createdAt;



    const result = await mongoSearch(filter, bbox, extremeWeatherEvents, createdAt);

    if(result.error){
        res.status(result.error.code).send({
            message: result.error.message
          });
    }else{
        const result2 = {tweets: result};
        console.log("sending result")
        res.status(200).json(result2);
    }

}


module.exports = {
  postSandboxSearch,
    postMongoSearch
};
