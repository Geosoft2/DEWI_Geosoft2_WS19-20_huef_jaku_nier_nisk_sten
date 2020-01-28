// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * Proofs if the boolean-parameter is a valid boolean
 * @param {*} boolean
 * @param {String} parametername
 * @returns {boolean}
 */
const booleanValid = function (boolean, parametername) {
    if (typeof (boolean) !== "boolean") {
        return {error: 'Parameter \'' + parametername + '\' must be a Boolean.'};
    } else {
        return true;
    }
};

module.exports = {
    booleanValid
};
