// jshint esversion: 6
// jshint node: true
"use strict";

const nodemailer = require('nodemailer');
const config = require('config-yml');
const path = require('path');
// config.notification.email.username;

const emailNotification = function(weatherChanges){

    // Beispiel für eine GMX-Email Adresse, bei anderen Anbietern unterscheidet sich der "Host" und ggf. der Port
    let transporter = nodemailer.createTransport({
        host: config.notification.email.options.host,
        port: config.notification.email.options.port,
        secure: false, // if false TLS
        auth: {
            user: config.notification.email.from.adress, // Email-Adresse vom Absender
            pass: config.notification.email.from.password // Passwort zur zugehörigen Email-Adresse vom Absender
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
            '<li>and there were <b>' + weatherChanges.new + '</b> new extreme weather events.</li>' +
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
