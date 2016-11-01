'use strict';

var env = process.env;

var xml2js = require('xml2js'),
    Promise = require('promise'),
    schedule = require('node-schedule'),
    http = require('http'),
    https = require('https'),
    util = require('util');

env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var SCHEDULE = '* * * * *';

var plexHost = env.PLEX_HOST || 'localhost';
var plexPort = env.PLEX_PORT || '32400';
var domoticzHost = env.DOMOTICZ_HOST || 'localhost';
var domoticzPort = env.DOMOTICZ_PORT || '443';
var domoticzUrl = env.DOMOTICZ_URL || 'json.htm';
var domoticzIdx = env.DOMOTICZ_IDX || '1';
var domoticzVariable = env.DOMOTICZ_VAR || 'plex_status';

var previousValue = '';

var xmlFromRest = function(options) {
    return new Promise(function(resolve, reject) {
        var done = function() {
            try {
                xml2js.parseString(xml, function (err, result) {
                    if (err === null) {
                        resolve(result);
                    } else {
                        console.error("Error while parsing result: " + err);
                    }
                });
            } catch (e) {
                reject(e);
            }
        };

        try {
            var xml = "";
            var reqGet = http.request(options, function (res) {
                res.on('data', function (d) {
                    xml += d;
                });

                res.on('end', function () {
                    done();
                });
            });

            reqGet.end();

            reqGet.on('error', function (e) {
                reject('Failed to get ' + options.path + ': ' + e);
            });
        } catch (e) {
            reject('Error: ' + e);
        }
    });
};

var run = function() {
    var options = {
        host: plexHost,
        port: plexPort,
        rejectUnauthorized: false,
        path: '/status/sessions',
        method: 'GET'
    };

    xmlFromRest(options).then(function (xml) {
        var status = 'IDLE';
        try {
            var title = xml.MediaContainer.Video[0].$.title;
            status = xml.MediaContainer.Video[0].Player[0].$.state;

            if (status === undefined) {
                status = 'IDLE';
            }

            if (status !== previousValue) {
                var text = status.charAt(0).toUpperCase() + status.slice(1) + ':' + title;

                console.log("Video '" + title + "' playing.");
                https.get("https://" + domoticzHost + ":" + domoticzPort + "/" + domoticzUrl + "?type=command&param=updateuservariable&vname=" + domoticzVariable + "&vtype=2&vvalue=" + status);
                https.get("https://" + domoticzHost + ":" + domoticzPort + "/" + domoticzUrl + "?type=command&param=addlogmessage&message=Video " + text);
                https.get("https://" + domoticzHost + ":" + domoticzPort + "/" + domoticzUrl + "?type=command&param=udevice&idx=" + domoticzIdx + "&nvalue=0&svalue=" + text);
                previousValue = status;
            }
        } catch (e) {
            console.log("No video playing.");

            try {
                if (status !== previousValue) {
                    https.get("https://" + domoticzHost + ":" + domoticzPort + "/" + domoticzUrl + "?type=command&param=udevice&idx=" + domoticzIdx + "&nvalue=0&svalue=" + status);
                    previousValue = status;
                }
            } catch (e) {
                console.error("Unable to send status to domoticz: " + e);
            }
        }
    }, function (e) {
        console.error('Error while getting Plex status: ' + e);
    });
};

run();

schedule.scheduleJob(SCHEDULE, function () {
    run();
});
