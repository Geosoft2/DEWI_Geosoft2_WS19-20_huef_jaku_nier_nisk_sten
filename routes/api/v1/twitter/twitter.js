// jshint esversion: 8
// jshint node: true
"use strict";

const express = require('express');
const router = express.Router();
const OAuth = require('oauth');
const OAuth2 = OAuth.OAuth2;

const {
  getUserInformation,
  search,
  getPlaceInformation,
  getAllRules,
  deleteAllRules,
  setRules,
  getMediaKey,
  streamConnect
} = require('../../../../helpers/twitter');

const twitterToken = require('../../../../private/token.js').token.twitter_config;

var oauth2 = new OAuth2(twitterToken.consumerKey, twitterToken.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);

var token;
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
    console.log(token);
});

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

    const result = await search(q,bbox,since);

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


const setStreamFilter = function (req, res){
// router.post("/setStreamFilter", (req,res) => {
    var bbox = req.body.bbox;
    const rules = [];
    if (bbox) {
        rules.push({"value" :  " bounding_box: [" + String(bbox.southWest.lng) + " " + String(bbox.southWest.lat) + " " + String(bbox.northEast.lng) + " " + String(bbox.northEast.lat) + "]"});
    }
};


const stream = async function (req, res){
// router.get("/stream", async (req, res) => {
    let  currentRules;
    const rules = [
        {"value": "bounding_box: [-118.58230590820312 33.90119657968225 -118.24422607421875 34.14306652783193]"},
        {"value": "bounding_box: [13.270111083984375 52.46228526678029 13.493957519531248 52.56842095734828]"},
        ];

    /** try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules(token);

        // Delete all rules. Comment this line if you want to keep your existing rules.
        await deleteAllRules(currentRules, token);

        // Add rules to the stream. Comment this line if you want to keep your existing rules.
        await setRules(rules, token);
    } catch (e) {
        console.error(e);
        process.exit(-1);
    }
     */

    await setRules(rules, token);

    // Listen to the stream.
    // This reconnection logic will attempt to reconnect when a disconnection is detected.
    // To avoid rate limites, this logic implements exponential backoff, so the wait time
    // will increase if the client cannot reconnect to the stream.

    const stream = streamConnect(token, req, res);
    let timeout = 0;
    stream.on('timeout', () => {
        // Reconnect on error
        console.log('A connection error occurred. Reconnecting…');
        setTimeout(() => {
            timeout++;
            streamConnect(token);
        }, 2 ** timeout);
    });
};


module.exports = {
  getPlaceCoord,
  getUser,
  postSearch,
  setStreamFilter,
  stream
};