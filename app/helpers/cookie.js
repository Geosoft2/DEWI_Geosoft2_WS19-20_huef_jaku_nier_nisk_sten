// jshint esversion: 6
// jshint node: true
"use strict";

const cookieExtractor = function(req, cookieName) {
    var cookie = null;
    if (req && req.cookies){
        cookie = req.cookies[cookieName];
    }
    return cookie;
};


module.exports = {
  cookieExtractor
};