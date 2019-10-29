const express = require('express');
const app = express();
var path = require('path');
var OAuth2 = require('oauth').OAuth2;
var Twitter = require('twitter-node-client').Twitter;

var https = require("https");

var server = require('http').createServer(app);

const mongodb = require('mongodb');




var config = require(path.join(__dirname , "../private/token.js")).token.twitter_config;


var token = null;
var oauth2 = new OAuth2(config.consumerKey, config.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);
oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
}, function (e, access_token) {
    token = access_token;
});

function connectMongoDb() {
    // finish this block before the server starts,
    // there are some async tasks inside we need to wait for => declare async so we can use await
    (async () => {

        try {
            // Use connect method to the mongo-client with the mongod-service
            //                      and attach connection and db reference to the app

            // using a local service on the same machine
            //app.locals.dbConnection = await mongodb.MongoClient.connect("mongodb://localhost:27017", {useNewUrlParser: true});

            // using a named service (e.g. a docker container "mongodbservice")
            app.locals.dbConnection = await mongodb.MongoClient.connect("mongodb://mongo:27017", {useNewUrlParser: true});

            app.locals.db = await app.locals.dbConnection.db("itemdb");
            console.log("Using db: " + app.locals.db.databaseName);
        } catch (error) {
            try {
                app.locals.dbConnection = await mongodb.MongoClient.connect("mongodb://localhost:27017", {useNewUrlParser: true});
                app.locals.db = await app.locals.dbConnection.db("itemdb");
                console.log("Using db: " + app.locals.db.databaseName);
            } catch (error2) {
                console.dir(error2);
                console.dir(error);
                setTimeout(connectMongoDb, 3000); // retry until db-server is up
            }
        }

    })();
}

connectMongoDb();

app.use(express.static(path.join(__dirname, '../app')));

app.use("/jquery", express.static(path.join(__dirname , "../node_modules/jquery/dist")));





app.get("/twitter/search", (req,res) => {

    var endpoint = 'https://api.twitter.com/1.1/search/tweets.json?q=rain';

    const options = {
        headers: {
            Authorization: 'Bearer ' + token
        }
    };

    https.get(endpoint, options, (httpResponse) => {
        // concatenate updates from datastream

        var body = "";
        httpResponse.on("data", (chunk) => {
            //console.log("chunk: " + chunk);
            body += chunk;
        });

        httpResponse.on("end", () => {

            try {
                var weather = JSON.parse(body);
            }
            catch(err){
                console.dir(err);
                res.status(500).send({error: "no vaild study id"})
                return;
            }

            res.json(weather);

        });

        httpResponse.on("error", (error) => {
            JL().warn("Movebank Api not working" + error);
            res.send("Movebank Api is not working")
        });
    });



});


app.listen(3000, function () {
    console.log('App listening on port 3000!');
});

module.exports = app;
