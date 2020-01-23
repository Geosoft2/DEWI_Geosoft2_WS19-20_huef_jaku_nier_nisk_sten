// jshint esversion: 8
// jshint node: true
"use strict";


const fs = require('fs');
const path = require('path');

const {booleanValid} = require('../../../../helpers/validation/boolean');

/**
 * @desc (de)activates the demo-mode
 * @param {object} req request, containing information about the HTTP request
 * @param {object} res response, to send back the desired HTTP response
 */
const postDemo = async function(req, res){
  try{
    var active = req.body.active;
    const valid = booleanValid(active, 'active');
    if(valid.error){
      return res.status(400).send({message: valid.error});
    }
    var content = {
      demo: active,
    };
    if(active){
      fs.writeFileSync(path.join(__dirname, '..', '..', '..', '..', 'demo', 'isDemo.json'), JSON.stringify(content));
      console.log('Demo activated');
      res.status(200).send({message: 'Demo is activated.'});
    }
    else {
      if(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'demo', 'isDemo.json'))).demo){
        fs.writeFileSync(path.join(__dirname, '..', '..', '..', '..', 'demo', 'isDemo.json'), JSON.stringify(content));
        console.log('Demo not activated');
        return res.status(200).send({message: 'Demo is not activated.'});
      }
      console.log('Demo not activated');
      res.status(200).send({message: 'Demo is not activated.'});
    }
  }
  catch(err){
    res.status(500).send({message: err});
  }
};


module.exports = {
  postDemo
};
