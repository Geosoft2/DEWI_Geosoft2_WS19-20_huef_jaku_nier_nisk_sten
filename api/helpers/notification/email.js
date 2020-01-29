// jshint esversion: 6
// jshint node: true
"use strict";

const nodemailer = require('nodemailer');
const config = require('config-yml');
const path = require('path');
const chalk = require('chalk');


/**
 * @desc function which sends an email if there is a change concerning the extrem weather events. Therefore the function
 * is called in the extremeWeather.js. The email is send from the DEWI gmx.de account and informs the user about new and
 * deleted extreme weather events. Parameters are customizable by the config.yml.
 * @param weatherChanges
 */
const emailNotification = function (weatherChanges) {

    var present; // tense and plural/ singular for notification
    var past; // tense and plural/ singular for notification

    // specification concerning plural/ singular
    if (weatherChanges.deleted > 1 || weatherChanges.deleted === 0) {
        past = " were ";
    } else {
        past = " was ";
    }

    if (weatherChanges.new > 1 || weatherChanges.new === 0) {
        present = " are ";
    } else {
        present = " is ";
    }

    // gmx-email account
    let transporter = nodemailer.createTransport({
        host: config.api.notification.email.options.host,
        port: config.api.notification.email.options.port,
        secure: config.api.notification.email.options.secure, // if false TLS
        auth: {
            user: config.api.notification.email.from.address, // email of the sender
            pass: config.api.notification.email.from.password // Passwort of the sender
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: config.api.notification.email.options.tls.rejectUnauthorized
        }
    });
    var from = config.api.notification.email.from.sender;
    if(!from){
      from = config.api.notification.email.from.address; // default email adress without any additions
    }
    console.log(from);
    var mailOptions = {
        from: from, // sender address
        to: config.api.notification.email.to.receiver, // list of receivers
        subject: 'DEWI notification: change extreme weather events', // Subject line
        html: 'Dear user,<br>' +
            '<p>the weather situation has changed. Here is a small summary concerning the changes:' +
            '<ul>' +
            '<li>There' + past + '<b>' + weatherChanges.deleted + '</b>' + ' extreme weather events deleted,</li>' +
            '<li>and there' + present + '<b>' + weatherChanges.new + '</b>' + ' new extreme weather events.</li>' +
            '</ul></p>' +
            '<p>If you like to have an overview about what has changed, simply visit our ' +
            '<a href="http://'+config.app.hostname+':'+config.app.port+'" target="_blank">Homepage</a>.</p>' + //TODO docker
            '<p>Best, <br> your DEWI team!</p>' +
            '<img src="cid:DEWILogo" alt="DEWI Logo" style="width: 200px;">',
        attachments: [{
            filename: 'DEWI_Logo.svg',
            path: path.join(__dirname, '..', '..', 'logo', 'DEWI_Logo.svg'),
            cid: 'DEWILogo' //same cid value as in the html img src
        }]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(chalk.red('Email-Configuration is not complete respectively incorrect. More info:'));
            console.log(error);
        } else {
            console.log(chalk.green('Email sent: ' + info.response));
        }
    });
};

module.exports = {emailNotification};
