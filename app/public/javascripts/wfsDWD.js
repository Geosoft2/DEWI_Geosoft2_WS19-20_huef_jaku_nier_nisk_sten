// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";
let socket = io('http://' + location.hostname + ':3001');

// https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geowebservice.pdf?__blob=publicationFile&v=11

var markersInMap = [];

var mapOptions = {
    center: [51, 10],
    zoom: 6,
    zoomControl: true,
    dragging: true,
    attributionControl: true
};

var map = new L.map('mapWFS', mapOptions);

var osmlayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
});

// list of layers which will be initally added to the map
var baseLayers = {
    "OpenStreetMap": osmlayer.addTo(map),
    "Esri World Imagery": Esri_WorldImagery
};

// add pan-control in the bottomleft of the map
L.control.pan({position: 'bottomleft'}).addTo(map);


/*
settings button for setting the default map extent
 */
L.easyButton('<i class="fas fa-cog"></i>', function (btn, map) {

    if (confirm("set actual map extent as new default map extent")) {
        var cookieValue = JSON.stringify(bounds);
        // cookie to store the map extent
        setCookie("defaultBbox", cookieValue, 1000000);
    }
}).addTo(map);

var extremeWeatherGroup = L.layerGroup();
var warnlayer;
var radarlayer;


/**
 * adds the Tweets to the map that lay within the wfslayers and the current mapextend
 * @param wfsLayers
 */
function addTweets(wfsLayers, tweets, bounds) {
    var tweetsInWfsLayers = [];
    var tweetsInMap = getTweets();

    for (var t = 0; t < markersInMap.length; t++) {

        if (!isTweetInMapextend(markersInMap[t], bounds)) {
            map.removeLayer(markersInMap[t]);
            for (var i in tweetsInMap) {
                if (tweetsInMap[i].tweetId === markersInMap[t].tweetId) {
                    console.log(tweetsInMap);
                    tweetsInMap.splice(i, 1);
                }
            }
            markersInMap.splice(t, 1);
            t--;
        } else {
            // console.log(markersInMap[t]._leaflet_id);
        }
    }


    console.log(wfsLayers)
    for (var t in tweets) {
        if (isTweetInWfsLayer(tweets[t], wfsLayers.features, bounds)) {
            console.log("tweet" + tweets[t] + "is in WFS Layer");
            tweetsInWfsLayers.push(tweets[t]);
        }
    }

    var newTweets = [];
    for (var t in tweetsInWfsLayers) {   // creates a marker for each tweet and adds them to the map

        // should only add a marker if not already one with the same id exists

        if (!isMarkerAlreadyThere(tweetsInWfsLayers[t])) {
            newTweets.push(tweetsInWfsLayers[t])
        }
    }

    tweetsInMap = tweetsInMap.concat(newTweets);
    console.log(tweetsInMap);
    setTweets(tweetsInMap);
    for (var n in newTweets) {
        var marker = L.marker([newTweets[n].places.coordinates.lat, newTweets[n].places.coordinates.lng]).addTo(map);
        //TODO: give the marker the attributes of the tweets that it should have
        marker.tweetId = newTweets[n].tweetId;
        markersInMap.push(marker);
        //marker.setIcon()
    }
    console.log(markersInMap);
}

/**
 * checks whether a marker with the same id as the given tweet already exists
 * @param tweet
 * @returns {boolean}
 */
function isMarkerAlreadyThere(tweet) {
    for (var i in markersInMap) {
        if (markersInMap[i].tweetId === tweet.tweetId) {
            return true;
        }
    }
    return false;
}

/**
 * checks if the Tweet is located in the current mapextend
 * @param marker
 * @returns {*} boolean
 */
function isTweetInMapextend(marker, bounds) {
    var point = {   //convert the tweet location in a readable format for turf
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [marker._latlng.lat, marker._latlng.lng]
        },
        properties: {}
    };
    var bbox = turf.polygon([[
        [bounds.bbox.southWest.lat, bounds.bbox.southWest.lng],
        [bounds.bbox.southWest.lat, bounds.bbox.northEast.lng],
        [bounds.bbox.northEast.lat, bounds.bbox.northEast.lng],
        [bounds.bbox.northEast.lat, bounds.bbox.southWest.lng],
        [bounds.bbox.southWest.lat, bounds.bbox.southWest.lng]
    ]]);
    return turf.booleanWithin(point, bbox);
}

/**
 * checks if the given tweet lays within the given layers and the current mapextend
 * @param tweet
 * @param wfsLayers
 * @returns {boolean}
 */
function isTweetInWfsLayer(tweet, wfsLayers, bounds) {
    var point = {   //convert the tweet location in a readable format for turf
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [tweet.places.coordinates.lat, tweet.places.coordinates.lng]
        },
        properties: {}
    };
    var bbox = turf.polygon([[
        [bounds.bbox.southWest.lat, bounds.bbox.southWest.lng],
        [bounds.bbox.southWest.lat, bounds.bbox.northEast.lng],
        [bounds.bbox.northEast.lat, bounds.bbox.northEast.lng],
        [bounds.bbox.northEast.lat, bounds.bbox.southWest.lng],
        [bounds.bbox.southWest.lat, bounds.bbox.southWest.lng]
    ]]);

    for (var w in wfsLayers) {
        var p=[];
        for (var i of wfsLayers[w].geometry.coordinates[0][0]){
            p.push([i[1],i[0]]);
        }
        var polygon = turf.polygon([
            p
        ]);
        if (turf.booleanWithin(point, polygon) &&
            turf.booleanWithin(point, bbox)) {
            return true;
        }
    }
    return false;
}

/**
 * @desc creates a json within the current map-extent as coordinates
 * @param {json} bounds coordinates of current map-extent
 * @return json
 */
function boundingbox(bounds) {
    return {
        bbox: {
            southWest: {
                lat: bounds._southWest.lat,
                lng: bounds._southWest.lng
            },
            northEast: {
                lat: bounds._northEast.lat,
                lng: bounds._northEast.lng
            }
        }
    };
}

// function saveDataInMongo(feature){
//   console.log('feature', feature);
//   $.ajax({
//    type: "POST",
//    url: 'http://localhost:3001/api/v1/mongo/extremeWeather',
//    // contentType: "application/json",
//    dataType: 'json',
//    data: feature
//   })
//   .done(function(response) {
//     console.log(response);
//   })
//   .fail(function(err){
//     console.log(err.responseText);
//   });
// }


function requestEvent() {
    var bounds = map.getBounds();
    var bbox = boundingbox(bounds);
    var events = $('#selectEvent').val();
    requestExtremeWeather(bbox, events);
}


function testSocket() {
    socket.on('weatherchanges', function (data) {
        console.log('Weather changed');
        console.log(data.stats);
        requestEvent();
    });
}

/**
 * @desc queries the extreme weather events based on the current map-extent and add it to the map
 * @param {json} bbox coordinates of current map-extent
 */
function requestExtremeWeather(bbox, events) {

    return new Promise(function (resolve, restrict) {
        $.ajax({
            type: "Get",
            url: 'http://' + location.hostname + ':3001/api/v1/mongo/extremeWeather',
            data: {
                events: events,
                bbox: bbox.bbox,
                minutes: 0.2 // value must match interval time /bin/www
            }
            // contentType: "application/json",
        })
            .done(function (response) {
                console.log('mongo', response.result);
                // remove existing layer
                removeExistingLayer(warnlayer);
                // create new layer
                warnlayer = createLayer(response.result);
                // add layer to layerGroup and map
                extremeWeatherGroup.addLayer(warnlayer).addTo(map);
                resolve(response.result);
            })
            .fail(function (err) {
                console.log(err);
                console.log(err.message);
            });
    })
}


// /**
//  * @desc queries the extreme weather events based on the current map-extent and add it to the map
//  * @param {json} bbox coordinates of current map-extent
//  */
// function requestExtremeWeather(bbox){
//   $.ajax({
//    type: "POST",
//    url: 'http://localhost:3001/api/v1/dwd/extremeWeather',
//    // contentType: "application/json",
//    dataType: 'json',
//    data: bbox
//   })
//   .done(function(response) {
//     console.log(response);
//     // remove existing layer
//     removeExistingLayer(warnlayer);
//     // create new layer
//     warnlayer = createLayer(response);
//     // add layer to layerGroup and map
//     extremeWeatherGroup.addLayer(warnlayer).addTo(map);
//   })
//   .fail(function(err){
//     console.log(err.responseText);
//   });
// }

/**
 * @desc checks if layer exists and remove it from map
 * @param {json} layer
 */
function removeExistingLayer(layer) {
    if (layer) {
        extremeWeatherGroup.removeLayer(layer);
        layer.remove();
    }
}

/**
 * @desc creates a layer from GeoJson
 * @param {geoJson} data
 */
function createLayer(data) {
    return L.geoJson(data, {
        style: function (feature) {
            return {
                stroke: false,
                fillColor: 'FFFFFF',
                fillOpacity: 0.5
            };
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup('<h1>' + feature.properties.HEADLINE + '</h1><p>' + feature.properties.NAME + '</p><p>' + feature.properties.DESCRIPTION + '</p>');
        }
    });
}

// request percipitation radar wms from dwd and add it to the map
var rootUrl = 'https://maps.dwd.de/geoserver/dwd/ows';
radarlayer = L.tileLayer.wms(rootUrl, {
    layers: 'dwd:FX-Produkt',
    // eigene Styled Layer Descriptor (SLD) können zur alternativen Anzeige der Warnungen genutzt werden (https://docs.geoserver.org/stable/en/user/styling/sld/reference/)
    // sld: 'https://eigenerserver/alternativer.sld',
    format: 'image/png',
    transparent: true,
    opacity: 0.8,
    attribution: 'Percipitation radar: &copy; <a href="https://www.dwd.de">DWD</a>'
}).addTo(map);

var overLayers = {
    "<span title='show extreme weather events'>extreme weather events</span>": extremeWeatherGroup,
    "<span title='show percipitation radar'>percipitation radar</span>": radarlayer
};
// Layercontrol-Element erstellen und hinzufügen
L.control.layers(baseLayers, overLayers).addTo(map);

/**
 * @desc function for creating a new cookie
 * @param cname name of the cookie
 * @param cvalue value of the cookie
 * @param exdays number of days until the cookie shall be deleted
 * @source https://www.w3schools.com/js/js_cookies.asp
 */
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
