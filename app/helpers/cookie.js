// jshint esversion: 6
// jshint node: true
"use strict";

/**
 * @desc extracts a cookie by the delivered cookieName
 * @param {object} req request, containing information about the HTTP request
 * @param {string} cookieName name of the cookie
 */
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
