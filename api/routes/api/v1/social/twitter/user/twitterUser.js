// jshint esversion: 8
// jshint node: true
"use strict";

const {
    getUserInformation,
} = require('../../../../../../helpers/twitter/additionalInformation');



const getUser = async function (req, res){
// router.get("/getUser/:id", async (req, res) => {
    const result= await getUserInformation(req.params.id);
    res.json(result);
};


module.exports = {
  getUser
};
