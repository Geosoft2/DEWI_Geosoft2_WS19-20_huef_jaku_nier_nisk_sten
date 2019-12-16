// jshint esversion: 8
// jshint node: true
"use strict";

const {
    getPlaceInformation,
} = require('../../../../../../helpers/twitter/additionalInformation');


const getPlaceCoord = async function (req, res){
// router.get("/getPlaceCoord/:placeId", async (req, res) => {
    const result= await getPlaceInformation(req.params.placeId);
    res.json(result);
};




module.exports = {
  getPlaceCoord
};
