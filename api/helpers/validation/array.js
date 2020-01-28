// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * Proofs if the array-parameter is a valid string array
 * @param {*} array
 * @param {String} parametername
 * @returns {boolean}
 */
const stringArrayValid = function (array, parametername) {
    if (!Array.isArray(array)) {
        return {error: 'Parameter \'' + parametername + '\' must be an array.'};
    } else if (array.every(function (i) {
        return typeof i === "string";
    }) === false) {
        return {error: 'Parameter \'' + parametername + '\' must be an array of strings.'};
    } else {
        return true;
    }
};

module.exports = {
    stringArrayValid
};
