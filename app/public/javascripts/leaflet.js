// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";

let socket = io('http://'+ apiHost);

var greenIcon = new L.Icon({
    iconUrl: '/media/images/marker-icon-blue-white.png',
    //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var blueIcon = new L.Icon({
    iconUrl: '/media/images/marker-icon-white-blue.png',
    //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geowebservice.pdf?__blob=publicationFile&v=11

var markersInMap = [];

var mapOptions = {
    zoomControl: true,
    dragging: true,
    attributionControl: true
};

var map = new L.map('mapWFS', mapOptions);
const osmlayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
});

//event handler when all tiles of the background map are loaded
osmlayer.on('load', () => {
    maploaded();
    loading = false;
});
var loading = false;
osmlayer.on('loading', () => {
    loading = true;
});

/**
 * @desc Show a Snackbar and advances the progress bar when map is loaded
 */
function maploaded() {
    document.getElementById("progressbar").value += 25;
    isProgress();
    snackbarWithText("Map loaded.");
}

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
});

Esri_WorldImagery.on('load', () => {
    maploaded();
    loading = false;
});
Esri_WorldImagery.on('loading', () => {
    loading = true;
});

// list of layers which will be initally added to the map
var baseLayers = {
    "OpenStreetMap": osmlayer.addTo(map),
    "Esri World Imagery": Esri_WorldImagery
};

// add pan-control in the bottomleft of the map
L.control.pan({position: 'bottomright'}).addTo(map);

/**
 * @desc function which creates a cookie if the button changeDefaultMapExtent is pushed.
 */
function changeDefaultMapExtent() {
    var bounds = map.getBounds();
    var bbox = boundingbox(bounds);
    var cookieValue = JSON.stringify(bbox);
    setCookie("defaultBbox", cookieValue, 1000000);
    snackbarWithText('Successfully set new default map extent. <a href="/faq#Map" target="_blank">Further information</a>.');
}

/**
 * @desc function which sets the map back to the defaultMapExtent. If there is no default map extent set by the user,
 * its the initial map extent.
 */
function backToDefaultMapExtent() {
    var isThereCookie = getBoundingBboxFromCookie();
    if (isThereCookie === false) {
        map.fitBounds([[54.71192884840614, 23.73046875], [46.965259400349275, -3.7353515625000004]]);
    }
    snackbarWithText('Successfully get default map extent. <a href="/faq#Map" target="_blank">Further information</a>.');
}

/**
 * @desc function which deletes the defaultBbox cookie
 */
function deleteDefaultBbox() {
    var name = "defaultBbox";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    snackbarWithText('Successfully delete default map extent. <a href="/faq#Map" target="_blank">Further information</a>.');
}

/**
 * @desc function which creates a cookie if the button setDefaultEvents is pushed.
 */
function setDefaultEvents() {
    var events = $('#selectEvent').val();
    var cookieValue = JSON.stringify(events);
    setCookie("defaultEvents", cookieValue, 1000000);
    snackbarWithText('Successfully set new default weather events. <a href="/faq#Weather" target="_blank">Further information</a>.');
}


/**
 * @desc function which sets the weather events back to the defaultEvents.If there is no default weather event set by the user,
 * its the initial weather event.
 */
function getDefaultEvents() {
    var events = getInitialEvents();
    $('.selectpicker').selectpicker('val', events);
    eventsOrFilterChanged();
    snackbarWithText('Successfully get default weather events. <a href="/faq#Weather" target="_blank">Further information</a>.');
}


/**
 * @desc function which deletes the defaultEvents cookie
 */
function deleteDefaultEvents() {
    var name = "defaultEvents";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    snackbarWithText('Successfully delete default weather events. <a href="/faq#Weather" target="_blank">Further information</a>.');
}


var extremeWeatherGroup = L.layerGroup();
var warnlayer;
var radarlayer;

/**
 * @desc Removes all Tweets from the Map and updates List
 */
function removeAllTweets() {
    var tweetsInMap = getState("tweets");
    for (var i = 0; i < tweetsInMap.length; i++) {
        map.removeLayer(markersInMap[i]);
        markersInMap.splice(i, 1);
        tweetsInMap.splice(i, 1);
        i--;
    }
    setTweets([]);
}

/**
 * @desc Removes all Tweets which are not in wfsLayers or in the current Map extend and updates the list
 * @param {JSON} wfsLayers to proof if they contains the tweet
 * @param {JSON} bounds to proof if they contains the tweet
 */
function removeTweets(wfsLayers, bounds) {
    var tweetsInMap = getState("tweets");

    for (var t = 0; t < tweetsInMap.length; t++) {
        if (!isTweetInWfsLayer(tweetsInMap[t], wfsLayers.features, bounds)) {
            for (var i in markersInMap) {
                if (tweetsInMap[t].tweetId === markersInMap[i].tweetId) {
                    map.removeLayer(markersInMap[i]);
                    markersInMap.splice(i, 1);
                }
            }
            tweetsInMap.splice(t, 1);
            t--;
        }
    }
    setTweets(tweetsInMap);
}

/**
 * @desc adds the Tweets to the map that lay within the wfslayers and the current mapextend
 * @param {JSON} wfsLayers current data
 * @param {Array} tweets tweets deliverd by the API
 * @param {JSON} bounds bounds of the current map extend
 */
function addTweets(tweets) {

    var newTweets = [];
    for (var t in tweets) {   // creates a marker for each tweet and adds them to the map
        // should only add a marker if not already one with the same id exists
        if (!isMarkerAlreadyThere(tweets[t])) {
            newTweets.push(tweets[t]);
        }
    }

    var tweetsInMap = getState("tweets");
    tweetsInMap = tweetsInMap.concat(newTweets);
    setTweets(tweetsInMap);
    for (var n in newTweets) {
        var marker = L.marker([newTweets[n].geometry.coordinates[1], newTweets[n].geometry.coordinates[0]]).addTo(map);

        //TODO: give the marker the attributes of the tweets that it should have
        marker.tweetId = newTweets[n].tweetId;
        marker.on("click", function (e) {
            if (JSON.stringify(e.target._latlng) === JSON.stringify(getState('highlighted'))) {
                setMarkerColor(null);
                setHighlighted(null);
            } else {
                setMarkerColor(e.target._latlng);
                setHighlighted(e.target._latlng, true);
            }
        });
        markersInMap.push(marker);
        //marker.setIcon()
    }
    //highlites tweets if they should be highlited
    setMarkerColor(getState("highlighted"));
    //advance the progress bar
    if (loading) {
        document.getElementById("progressbar").value += 25;
    } else {
        document.getElementById("progressbar").value = 100;
    }
    isProgress();
    if (tweets.length > 1) {
        snackbarWithText("Tweets added to the map");
    }
}

/**
 * @desc Hides the prograss bar, if it is fullfilled
 */
async function isProgress() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    if (document.getElementById("progressbar").value === 100) {
        await delay(2000);
        if (document.getElementById("progressbar").value === 100) {
            document.getElementById("progressbar").style.visibility = 'hidden';
        }
    }
}

/**
 * checks whether a marker with the same id as the given tweet already exists
 * @param {JSON} tweet to proof
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
 *@desc checks if the given tweet lays within the given layers and the current mapextend
 * @param {JSON} tweet to proof
 * @param {Array} wfsLayers cuurent data
 * @returns {boolean}
 */
function isTweetInWfsLayer(tweet, wfsLayers, bounds) {
    var point = {   //convert the tweet location in a readable format for turf
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [tweet.geometry.coordinates[1], tweet.geometry.coordinates[0]]
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
        var p = [];
        for (var i of wfsLayers[w].geometry.coordinates[0][0]) {
            p.push([i[1], i[0]]);
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


/**
 * @desc queries the extreme weather events based on the current map-extent and add it to the map
 * @param {json} bbox coordinates of current map-extent
 */
function requestExtremeWeather(bbox, events) {


    return new Promise(function (resolve, restrict) {
        const WID = "W" + idGenerator();
        const date = new Date(Date.now());
        addRequest({id: WID, send: date.toUTCString(), status: "Pending"});
        $.ajax({
            type: "post",
            url: 'http://' + apiHost + '/api/v1/weather/events/dwd',
            headers: {
                "Content-Type": "application/json",
                'X-Request-Id': WID
            },
            data: JSON.stringify({
                bbox: bbox.bbox,
                events: events,
            })
        })
            .done(function (response) {
                addRequest({id: WID, send: date.toUTCString(), status: "Success"});
                // remove existing layer
                removeExistingLayer(warnlayer);
                // create new layer
                warnlayer = createLayer(response.weatherEvents);
                // add layer to layerGroup and map
                extremeWeatherGroup.addLayer(warnlayer);
                document.getElementById("progressbar").value +=25;
                resolve(response.weatherEvents);
                if (response.weatherEvents.features.length === 0) {
                    document.getElementById("progressbar").value += 100;
                    isProgress();
                    snackbarWithText("Weather data loaded.<br> No extreme weather event found.");
                } else {
                    document.getElementById("progressbar").value += 25;
                    isProgress();
                    snackbarWithText("Weather data loaded.");
                }
            })
            .fail(function (err) {
                document.getElementById("progressbar").value = 100;
                isProgress();
                snackbarWithText("Updated weather data is currently not available.");
                addRequest({id: WID, send: date.toUTCString(), status: "Failed"});
                console.log(err.message);
            });
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
 * convert ISO normed date to an user readable date
 * @param ISODate
 * @returns {string}
 */
function getDateTime(ISODate) {
    // example ISODate: 2020-01-23T10:35:00Z
    var DateTime;
    if (ISODate) {
        DateTime = ISODate.substring(0, 10) + ", " + ISODate.substring(11, 19);
    }
    return DateTime;
}

/**
 * get the color with which the area will be filled in dependence to the severity
 * @param severity
 * @returns {string}
 */
function getFillColor(severity) {
    var color;
    if(severity ==="Minor") {
        color = "yellow";
    }
    else if(severity === "Moderate") {
        color = "orange";
    }
    else if(severity === "Severe") {
        color = "#cc0000";
    }
    else if(severity === "Extreme") {
        color = "purple";
    }
    return color;
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
                fillColor: getFillColor(feature.properties.SEVERITY),
                fillOpacity: 0.4
            };
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup(('<h5>' + feature.properties.HEADLINE + '</h5>' +
                '<p><b>' + "Description: " + '</b>' + feature.properties.DESCRIPTION + '</p>' +
                '<p><b>' + "Severity: " + '</b>' + feature.properties.SEVERITY + '</p>' +
                '<p><b>' + "from: " + '</b>' + getDateTime(feature.properties.ONSET) + '</br>' +
                '<b>' + "to: " + '</b>' + getDateTime(feature.properties.EXPIRES) + '</br>' +
                '<b>' + "created at : " + '</b>' + getDateTime(feature.properties.EFFECTIVE) + '</p>'),
                {
                    autoPan: false,
                    autoClose: false
                }
            );
        }
    });
}

extremeWeatherGroup.addTo(map);


// // request percipitation radar wms from dwd and add it to the map
// var rootUrl = 'https://maps.dwd.de/geoserver/dwd/ows';
// radarlayer = L.tileLayer.wms(rootUrl, {
//     layers: 'dwd:FX-Produkt',
//     // eigene Styled Layer Descriptor (SLD) können zur alternativen Anzeige der Warnungen genutzt werden (https://docs.geoserver.org/stable/en/user/styling/sld/reference/)
//     // sld: 'https://eigenerserver/alternativer.sld',
//     format: 'image/png',
//     transparent: true,
//     opacity: 0.5,
//     attribution: 'Percipitation radar: &copy; <a href="https://www.dwd.de">DWD</a> | resolution TODO' // TODO
// });

var overLayers = {
    "<span title='show extreme weather events'>extreme weather events</span>": extremeWeatherGroup,
    // "<span title='show percipitation radar'>percipitation radar</span>": radarlayer
};

L.control.layers(baseLayers, overLayers).addTo(map);

var legend = L.control({position: 'bottomleft'});

/**
 * create legend for the extreme weather events
 * @param map
 * @returns {div}
 */
legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            colors = ['yellow', 'orange', '#cc0000', 'purple'],
            labels = ["Minor", "Moderate", "Severe", "Extreme"];
        div.innerHTML = '<b>' + "Weather Severity" + '</b><br>';

        for (var i = 0; i < labels.length; i++) {
            div.innerHTML +=
                '<p style="margin-bottom: 1px">' +
                '<i style="background:' + colors[i] + '"></i> ' +
                labels[i] + '</p>';// + '<br>';
        }
        div.innerHTML += '<p>' + "(Colors might differ" + '<br>' + "at overlapping areas)" + '</p>';

        div.innerHTML += "Source: <a href='https://www.dwd.de/DE/Home/home_node.html' target='_blank'>DWD</a>" + '<br>' +
            "Accuracy: municipal level" + '<br>' +
            "Last updated: " + '<var id="weatherTime">' + '<br>' + new Date(Date.now()).toUTCString() + '</var>';

        return div;

};

// var radarLegend = L.control({position: 'bottomleft'});

// /**
//  * create legend for the precipitation radar
//  * @param map
//  * @returns {div}
//  */
// radarLegend.onAdd = function (map) {
//
//     var div = L.DomUtil.create('div', 'info radarlegend');
//     div.innerHTML +=
//         '<img src="media/images/radar_legend.png" alt="precipitation radar legend" width="300" height="50" style="opacity: 0.8">';
//
//     return div;
//
// };

/**
 * add legend if the respective layer is shown in the map
 */
map.on('overlayadd', function (eventLayer) {
    // Switch to the Population legend...
    if (eventLayer.name === "<span title='show extreme weather events'>extreme weather events</span>") {
        // map.removeControl(legend);
        legend.addTo(this);
    }
    if (eventLayer.name === "<span title='show percipitation radar'>percipitation radar</span>") {
        // map.removeControl(legend);
        map.removeControl(radarLegend);
        radarLegend.addTo(this);
        legend.addTo(this);
    }
});

/**
 * remove legend if the respective layer is hidden from the map
 */
map.on('overlayremove', function (eventLayer) {
    // Switch to the Population legend...
    if (eventLayer.name === "<span title='show extreme weather events'>extreme weather events</span>") {
        map.removeControl(legend);
    }
    if (eventLayer.name === "<span title='show percipitation radar'>percipitation radar</span>") {
        map.removeControl(radarLegend);
    }
});



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
 * @desc Changes the colors of the marker, if they should be highlitet
 * @param {JSON} coordinates of the tweets that shoul be highlited
 */
function setMarkerColor(coordinates) {
    for (var marker of markersInMap) {
        if (JSON.stringify(marker._latlng) === JSON.stringify(coordinates)) {
            marker.setIcon(greenIcon);
        } else {
            marker.setIcon(blueIcon);
        }
    }
}
