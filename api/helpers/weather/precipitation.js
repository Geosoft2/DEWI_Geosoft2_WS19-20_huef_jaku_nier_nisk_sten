"use strict";

var R = require('r-script');


var getRadarData = function(productId) {

    return new Promise((resolve, reject) => {
        R("./precipitation.R")
            .data({ "productId": productId})
            .call(function(err, r) {
                if(err) throw err;

                console.log("PRECIPITATION");
                // console.log(r);

                if(r) {
                    resolve(r);
                } else {
                    resolve(false);
                }
            });
    });
};

module.exports = {getRadarData};