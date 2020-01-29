// jshint esversion: 8
// jshint node: true
"use strict";

const request = require('request');
const config = require('config-yml');
const chalk = require('chalk');

/**
 * @desc function which sends a mattermost notification
 * if there is a change concerning the extrem weather events. Therefore the function
 * is called in the extremeWeather.js. The notification informs the user about new and
 * deleted extreme weather events. Parameters are customizable by the config.yml.
 * @param weatherChanges
 */
const mattermostNotification = function (weatherChanges) {
    // parameter of the URL
    var rootUrl = config.api.notification.mattermost.url.hostname.yourMattermostSite;
    var generatedHookKey = config.api.notification.mattermost.url.hook.generatedHookKey;
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

    // parameter of the payload (defines the notification)
    var channel = "dewi_service"; // channel in the DEWI-Team: "dewi_service"
    var username = "DEWI_service";
    var icon_url = "http://localhost:3001/logo/DEWI_Logo.svg";
    var text = 'Dear user, \n' +
        'the weather situation has changed. Here is a small summary concerning the changes: \n' +
        'There' + past + weatherChanges.deleted + ' extreme weather events deleted, ' +
        'and there' + present + weatherChanges.new + ' new extreme weather events. \n' +
        'If you like to have an overview about what has changed, simply visit our ' +
        '[homepage](http://'+config.app.hostname+':'+config.app.port+')!\n' + //TODO docker
        'Best, your DEWI team!';
    var payload = {"channel": channel, "username": username, "icon_url": icon_url, "text": text};
    var payloadStringified = JSON.stringify(payload);

    const options = {
        url: 'https://' + rootUrl + '/hooks/' + generatedHookKey,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            payload: payloadStringified
        }
    };

    request.post(options)
        .on('response', function (response) {
            if (response.statusCode === 200) {
                console.log(chalk.green('Mattermost Notification was sent!'));
            } else {
                console.log(chalk.red('Mattermost-Configuration is not complete respectively incorrect. Check your generated hook-key.'));
            }

        })

        .on('error', function (err) {
            console.log(chalk.red('Mattermost-Configuration is not complete respectively incorrect. More info:'));
            console.log(err);
        });
};


module.exports = {
    mattermostNotification,
};
