// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * Proofs if the id-parameter is a valid mongoDB-ObjectID
 * @param {*} id
 * @param {String} parametername
 * @returns {boolean}
 */
const idValid = function (id, parametername) {
    var regEx = /^\d+$/;
    if (!regEx.test(id)) {
        return {error: 'Parameter \'' + parametername + '\' must be a Twitter-ID. This identifier only contains digits.'};
    } else {
        return true;
    }
};

module.exports = {
    idValid
};
