// jshint esversion: 6
// jshint node: true
"use strict";


const getMain = function (req, res) {
    res.render('index', {
        title: "DEWI API"
    });
};


module.exports = {
    getMain
};