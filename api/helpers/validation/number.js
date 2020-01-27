// jshint esversion: 6
// jshint node: true
"use strict";

const chalk = require('chalk');

/**
 * Proofs if the number-parameter is a valid number, else exit the server-process.
 * @param {*} number
 * @param {string} error
 * @returns {boolean}
 */
const numberValid = function (number, error) {
    if(isNaN(number) || number === false || number === true ){
      console.log(chalk.red(error));
      process.exit(-1);
    }
};

module.exports = {
    numberValid
};
