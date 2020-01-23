// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * Proofs if the id-parameter is a valid mongoDB-ObjectID
 * @param {*} id
 * @param {String} parametername
 * @returns {boolean}
 */
const idValid = function(id, parametername) {
  var regEx = /^[0-9a-fA-F]{24}$/;
  if(!regEx.test(id)){
    return {error: 'Parameter \''+parametername+'\' must be an ObjectID. This identifier is exactly 24 character long and only contain digits and characters a to f.'};
  }
  else{
    return true;
  }
};

module.exports = {
  idValid
};
