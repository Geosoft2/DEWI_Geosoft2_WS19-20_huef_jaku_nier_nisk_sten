// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";
// https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geowebservice.pdf?__blob=publicationFile&v=11

var bounds;
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

map.on('moveend', function (e) {
    // function which is triggered automatically when the map gets moved
    bounds = map.getBounds();
    mapExtendChange(bounds);
});

/*
settings button for setting the default map extent
 */
L.easyButton('<i class="fas fa-cog"></i>', function (btn, map) {

    if (confirm("set actual map extent as new default map extent")) {
        var cookieValue = JSON.stringify(boundingbox(bounds));
        // cookie to store the map extent
        setCookie("defaultBbox", cookieValue, 1000000);
    }
}).addTo(map);

var extremeWeatherGroup = L.layerGroup();
var warnlayer;
var radarlayer;

/**
 * @desc new extreme weather data are loaded after each change of map-extent
 * @param {json} bounds coordinates of current map-extent
 */
async function mapExtendChange(bounds) {
    // TODO: setTweets("array of tweets");
    var bbox = boundingbox(bounds);
    // TODO: uncomment updateTwitterStream after setStreamfilter works
    //await updateTwitterStream(bbox.bbox);
    requestExtremeWeather(bbox);
}

/**
 * adds the Tweets to the map that lay within the wfslayers and the current mapextend
 * @param wfsLayers
 */
function addTweets(wfsLayers) {
    var tweetsInWfsLayers = [];
    var tweets = [];
    // example for the tweets
    // TODO: delete example data after loading tweets from mongodb is working
    tweets.push({
        places: {
            coordinates: {
                lng: 13.404954,
                lat: 52.520008
            }
        }
    });
    tweets.push({
        places: {
            coordinates: {
                lng: 14.418540,
                lat: 50.073658
            }
        }
    });

    //TODO: get the tweets from mongodb and push them to tweets
    for (var t in tweets) {
       /* if (isTweetInWfsLayer(tweets[t], wfsLayers.features)) {
            tweetsInWfsLayers.push(tweets[t]);
        }*/
    }
    for (var t in tweetsInWfsLayers) {   // creates a marker for each tweet and adds them to the map
        L.marker([tweetsInWfsLayers[0].places.coordinates.lat, tweetsInWfsLayers[0].places.coordinates.lng]).addTo(map);
    }
}

/**
 * checks if the given tweet lays within the given layers and the current mapextend
 * @param tweet
 * @param wfsLayers
 * @returns {boolean}
 */
function isTweetInWfsLayer(tweet, wfsLayers) {
    var point = {   //convert the tweet location in a readable format for turf
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [tweet.places.coordinates.lat, tweet.places.coordinates.lng]
        },
        properties: {}
    };
    var bbox = turf.polygon([[
        [bounds._southWest.lat, bounds._southWest.lng],
        [bounds._southWest.lat, bounds._northEast.lng],
        [bounds._northEast.lat, bounds._northEast.lng],
        [bounds._northEast.lat, bounds._southWest.lng],
        [bounds._southWest.lat, bounds._southWest.lng]
    ]]);

    for (var w in wfsLayers) {
        var polygon = turf.polygon([[
            [wfsLayers[w].bbox[1], wfsLayers[w].bbox[0]],
            [wfsLayers[w].bbox[1], wfsLayers[w].bbox[2]],
            [wfsLayers[w].bbox[3], wfsLayers[w].bbox[2]],
            [wfsLayers[w].bbox[3], wfsLayers[w].bbox[0]],
            [wfsLayers[w].bbox[1], wfsLayers[w].bbox[0]]
        ]]);
        if (turf.booleanWithin(point, polygon) &&
            turf.booleanWithin(point, bbox)) {
            return true;
        }
    }
    return false;
}

/**
 * updates the TwitterStream with a new boundingbox
 * @param bbox
 */
function updateTwitterStream(bbox) {
    $.ajax({
        type: "POST",
        url: '/api/v1/twitter/setStreamFilter',
        // contentType: "application/json",
        dataType: 'json',
        data: bbox
    })
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

/**
 * @desc queries the extreme weather events based on the current map-extent and add it to the map
 * @param {json} bbox coordinates of current map-extent
 */
function requestExtremeWeather(bbox) {
    $.ajax({
        type: "POST",
        url: '/api/v1/dwd/extremeWeather',
        // contentType: "application/json",
        dataType: 'json',
        data: bbox
    })
        .done(function (response) {
            addTweets(response);
            // remove existing layer
            removeExistingLayer(warnlayer);
            // create new layer
            warnlayer = createLayer(response);
            // add layer to layerGroup and map
            extremeWeatherGroup.addLayer(warnlayer).addTo(map);
        })
        .fail(function (err) {
            console.log(err.responseText);
        });
}

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

/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
function initialExtremeWeather() {
    // initial bounding box with the area of germany
    var initialBbox = {
        bbox: {
            southWest: {
                lat: 47.2704, // southWest.lng
                lng: 6.6553 // southWest.lat
            },
            northEast: {
                lat: 55.0444, // northEast.lng
                lng: 15.0176 // southWest.lat
            }
        }
    };

    // get the new default boundingbox
    var newDefaultBbox = getCookie("defaultBbox");

    // if there is a boundingbox defined by the user it is used, if not the initial bounding box is used
    if (newDefaultBbox != "") {
        newDefaultBbox = JSON.parse(newDefaultBbox);

        var northEastLat = newDefaultBbox.bbox.northEast.lat;
        var northEastLng = newDefaultBbox.bbox.northEast.lng;
        var southWestLat = newDefaultBbox.bbox.southWest.lat;
        var southWestLng = newDefaultBbox.bbox.southWest.lng;

        map.fitBounds([[northEastLat, northEastLng], [southWestLat, southWestLng]])
    } else {
        requestExtremeWeather(initialBbox);
    }
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

/**
 * @desc function for requesting a cookie which was stored before
 * @param cname name of the cookie
 * @returns {string}
 * @source https://www.w3schools.com/js/js_cookies.asp
 */
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

