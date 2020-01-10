// jshint esversion: 6
// jshint node: true
"use strict";

const nodemailer = require('nodemailer');
const config = require('config-yml');
const path = require('path');

/**
 * @desc function which sends an email if there is a change concerning the extrem weather events. Therefore the function
 * is called in the extremeWeather.js. The email is send from the DEWI gmx.de account and informs the user about new and
 * deleted extreme weather events. Parameters are customizable by the config.yml.
 * @param weatherChanges
 */
const emailNotification = function(weatherChanges){

    // gmx-email account
    let transporter = nodemailer.createTransport({
        host: config.notification.email.options.host,
        port: config.notification.email.options.port,
        secure: false, // if false TLS
        auth: {
            user: config.notification.email.from.adress, // email of the sender
            pass: config.notification.email.from.password // Passwort of the sender
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: config.notification.email.options.tls.rejectUnauthorized
        }
    });
    var mailOptions = {
        from: config.notification.email.to.sender, // sender address
        to: config.notification.email.to.receiver, // list of receivers
        subject: 'DEWI notification: change extreme weather events', // Subject line
        html: 'Dear user,<br>' +
            '<p>the weather situation has changed. Here is a small summary concerning the changes:' +
            '<ul>' +
            '<li>There were <b>' + weatherChanges.deleted + '</b> extreme weather events deleted,</li>' +
            '<li>and there are <b>' + weatherChanges.new + '</b> new extreme weather events.</li>' +
            '</ul></p>' +
            '<p>If you like to have an overview about what has changed, simply visit our ' +
            '<a href="http://localhost:3000" target="_blank">Homepage</a>.</p>' + //TODO docker
            '<p>Best, <br> your DEWI team!</p>' +
            '<img src="cid:DEWILogo" alt="DEWI Logo" style="width: 200px;">',
        attachments: [{
            filename: 'DEWI_Logo.svg',
            path: path.join(__dirname, '..', '..', 'logo',  'DEWI_Logo.svg'),
            cid: 'DEWILogo' //same cid value as in the html img src
        }]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = {emailNotification};
