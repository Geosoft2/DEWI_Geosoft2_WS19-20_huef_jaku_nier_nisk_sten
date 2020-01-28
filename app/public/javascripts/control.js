// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 8
"use strict";
let wfsLayer;

/**
 * @desc Intial function which starts when the page is loaded
 * @param {*} boundingbox to set the map extend to
 * @param {*} events weather events to show in the map
 * @param {*} filter initial filter to search the tweets after
 */
async function initial(boundingbox, events, filter) {

    const delay = ms => new Promise(res => setTimeout(res, ms));

    document.getElementById("progressbar").value = 25;
    events = getInitialEvents(events);

    // "activate" select option
    for (var initialEvent in events) {
        $('#selectEvent option[value=' + events[initialEvent] + ']').attr('selected', 'selected');
    }

    filter = getInitialFilter(filter);

    startSocket();
    let twitterResponse;


    var bbox = getInitialBbox(boundingbox);


    if (bbox) {
        // updateTwitterStream(bbox, filter);
        // Start 2 "jobs" in parallel and wait for both of them to complete
        map.fitBounds([[bbox.bbox.northEast.lat, bbox.bbox.northEast.lng], [bbox.bbox.southWest.lat, bbox.bbox.southWest.lng]]);
        wfsLayer = await requestExtremeWeather(bbox, events);
        twitterResponse = await twitterSearch(bbox, filter, wfsLayer);

        addTweets(twitterResponse);
    }
    await delay(1000);
    // fade(document.getElementById("loader-wrapper"));
    // document.getElementById("loader-wrapper").classList.add('hidden');
    // document.getElementById("loader-wrapper").style.visibility='hidden';
}

function fade(element) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 50);
}

/**
 * @desc function which is called in the intitial function. If there is an event is the link it is used. If not
 * but there is a cookie with an event this is used. If there is no event in the link and in the cookie all events are
 * activated.
 * a cookie
 * @param {} events
 * @returns {string[]|any}
 */
function getInitialEvents(events) {

    var newDefaultEvents = getCookie("defaultEvents");

    if (events) {
        return JSON.parse(events);
    }

    if (newDefaultEvents !== "") {
        return JSON.parse(newDefaultEvents);
    } else { // TODO Test??
        events = ['TEST', 'HEAT', 'UV', 'POWERLINEVIBRATION', 'THAW', 'GLAZE', 'FROST', 'FOG', 'SNOWDRIFT', 'SNOWFALL', 'HAIL', 'RAIN', 'TORNADO', 'WIND', 'THUNDERSTORM'];
        return events;
    }
}


/**
 * @desc function which is called in the intitial function. If there is an textfilter in the link it is used. If not
 * but there is a cookie with an texfilter this is used. If there is no filter in the link and in the cookie the texfilter is empty
 * @param {string} filter set in the link
 * @returns {string} value of the filter
 */
function getInitialFilter(filter) {

    var newDefaultFilter = getCookie("defaultSearchWord");

    if (filter) {
        filter = JSON.parse(filter);
        // $('#textFilter').val(filter);
        for (var elem in filter) {
            var filterUrlEncoded = encodeURIComponent(filter[elem].toLowerCase());
            if (!document.getElementById('textFilter' + filterUrlEncoded) ||
                document.getElementById('textFilter' + filterUrlEncoded).innerText.toLowerCase() !== filter[elem].toLowerCase()) {
                createFilterBadge(filter[elem]);
            }
        }
        return filter;
    } else if (newDefaultFilter !== "") {
        newDefaultFilter = JSON.parse(newDefaultFilter);
        for (var elem in newDefaultFilter) {
            createFilterBadge(newDefaultFilter[elem]);
        }
        // $('#textFilter').val(newDefaultFilter);
        // $('#textFilter').attr("placeholder", "default search word: " + newDefaultFilter);
        return newDefaultFilter;
    } else {
        return filter;
    }
}


/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
function getInitialBbox(bbox) {

    if (bbox) {
        getBoundingBoxFromUrl(bbox);
        return null;
    } else if (getBoundingBboxFromCookie()) {
        return null;
    } else {
        // initial bounding box with the area of germany
        return {
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
    }
}

/**
 * @desc Proofs if a Cookie with a Bbox set. If yes sets the Map Extent to this Bbox
 */
function getBoundingBboxFromCookie() {
    var newDefaultBbox = getCookie("defaultBbox");

    if (newDefaultBbox !== "") {
        newDefaultBbox = JSON.parse(newDefaultBbox);
    }

    // if there is a boundingbox defined by the user it is used, if not the initial bounding box is used
    if (newDefaultBbox !== "") {

        var northEastLat = newDefaultBbox.bbox.northEast.lat;
        var northEastLng = newDefaultBbox.bbox.northEast.lng;
        var southWestLat = newDefaultBbox.bbox.southWest.lat;
        var southWestLng = newDefaultBbox.bbox.southWest.lng;

        map.fitBounds([[northEastLat, northEastLng], [southWestLat, southWestLng]]);
        return true;
    }
    return false;
}

/**
 * @desc Event Handler if the map extend was changed by the user
 */
map.on('moveend', function (e) {
    // function which is triggered automatically when the map gets moved
    var bounds = map.getBounds();
    bounds = boundingbox(bounds);
    mapExtendChange(bounds);
});

/**
 * @desc new extreme weather data and tweets are loaded after each change of map-extent
 * @param {json} bounds coordinates of current map-extent
 */
async function mapExtendChange(bounds) {

    document.getElementById("progressbar").value = 25;
    document.getElementById("progressbar").style.visibility = 'visible';

    var events = $('#selectEvent').val();
    var filter = getTweetFilters();
    removeTweets(wfsLayer, bounds);
    updateURL(bounds, events, filter);
    let twitterResponse;
    wfsLayer = await requestExtremeWeather(bounds, events);
    twitterResponse = await twitterSearch(bounds, filter, wfsLayer);
    addTweets(twitterResponse);
}

/**
 * @desc new extreme weather data and tweets are loaded after each change of the events or filter
 */
async function eventsOrFilterChanged() {
    document.getElementById("progressbar").value = 25;
    document.getElementById("progressbar").style.visibility = 'visible';
    var bounds = map.getBounds();
    bounds = boundingbox(bounds);
    var events = $('#selectEvent').val();
    var filter = getTweetFilters();
    updateURL(bounds, events, filter);
    let twitterResponse;
    removeAllTweets();
    wfsLayer = await requestExtremeWeather(bounds, events);
    twitterResponse = await twitterSearch(bounds, filter, wfsLayer);
    addTweets(twitterResponse);
}

function getTweetFilters() {
    var filters = [];
    $('.tweetFilter').each(function (index, filter) {
        filters.push(filter.innerText);
    });
    return filters;
}

function searchTweets() {
    var input = $('#textFilter');
    if (input.val() !== "") {
        var filter = input.val();
        input.val("");
        var filterUrlEncoded = encodeURIComponent(filter.toLowerCase());
        if (!document.getElementById('textFilter' + filterUrlEncoded) ||
            document.getElementById('textFilter' + filterUrlEncoded).innerText.toLowerCase() !== filter.toLowerCase()) {
            createFilterBadge(filter);
            eventsOrFilterChanged();
        }
    }
}

function createFilterBadge(filter) {
    var filterUrlEncoded = encodeURIComponent(filter.toLowerCase());
    $('#textFilters').append(
        '<span id="textFilter' + filterUrlEncoded + '" class="tweetFilter badge badge-pill badge-primary" style="margin-right: 3px; margin-bottom: 5px; font-size: 90%; padding-top: 2px; padding-bottom: 2px;">' +
        filter +
        '<button type="button" class="close btn btn-link" onclick="removeElementById(\'textFilter' + filterUrlEncoded + '\')" style="margin-left: 5px; font-size: 100%; text-shadow: none; ">' +
        '<span class="fas fa-times fa-xs">' +
        '</span>' +
        '</button>' +
        '</span>'
    );
}

function removeElementById(id) {
    var elem = document.getElementById(id);
    elem.parentNode.removeChild(elem);
    eventsOrFilterChanged();
}

/**
 * @desc function for requesting a cookie which was stored before
 * @param {Sting} cname name of the cookie
 * @returns {string} value of cookie
 * @source https://www.w3schools.com/js/js_cookies.asp
 */
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * @desc Creates some Socket-Client Listener
 */
function startSocket() {
    socket.on('tweet', async function (tweet) {
        const date = new Date(Date.now());
        setStatus("lastTweet", date.toUTCString());
        var bounds = map.getBounds();
        bounds = boundingbox(bounds);
        var filter = getTweetFilters();
        var twitterResponse = await twitterSearchOne(bounds, filter, wfsLayer, tweet.tweet.tweetId);
        if (!jQuery.isEmptyObject(twitterResponse)) {
            addTweets([twitterResponse]);
            var audio = new Audio('/media/audio/twitter-notification-sound.mp3');
            audio.play();
        }
    });
    socket.on('requestStatus', (status) => {
        setStatus("lastUpdates", status);
    });
    socket.on('weatherStatus', (status) => {
        if(status.success){
          setStatus("lastWeatherUpdate", new Date(status.timestamp).toUTCString());
        }
        else {
          setStatus("lastWeatherUpdate", 'Weather-Update is currently not avalaible. Last update: '+ new Date(status.timestamp).toUTCString());
        }
    });
    socket.on('weatherChanges', async function (data) {
        const date = new Date(Date.now());
        setStatus("lastWeather", date.toUTCString());
        browserNotification('DEWI', 'Extreme weather events changed.');
        var bounds = map.getBounds();
        bounds = boundingbox(bounds);
        console.log('Weather changed');
        var events = $('#selectEvent').val();
        var filter = getTweetFilters();
        removeAllTweets();
        let twitterResponse;
        wfsLayer = await requestExtremeWeather(bounds, events);
        twitterResponse = await twitterSearch(bounds, filter, wfsLayer);
        addTweets(twitterResponse);
    });
}

/**
 * @desc Creates a valid bbox out of a string which contains a bbox, sets the map extend to this bbox
 * @param {String} bbox
 */
function getBoundingBoxFromUrl(bbox) {
    var splitBbox = bbox.split(',');
    // bounding box from URL
    bbox = {
        bbox: {
            southWest: {
                lat: parseFloat(splitBbox[1]),
                lng: parseFloat(splitBbox[0])
            },
            northEast: {
                lat: parseFloat(splitBbox[3]),
                lng: parseFloat(splitBbox[2])
            }
        }
    };
    map.fitBounds([[bbox.bbox.northEast.lat, bbox.bbox.northEast.lng], [bbox.bbox.southWest.lat, bbox.bbox.southWest.lng]]);
    return bbox;
}

/**
 *  @desc Updates the URL to the user-specified data
 * @param {JSON} bbox chosen by the user
 * @param {Array} events chosen by the user
 * @param {Array} filter chosen by the user
 */
function updateURL(bbox, events, filter) {

    var parameters = {};

    if (bbox) {
        // URL has to be updated by filter to
        var lat1 = Math.round(bbox.bbox.southWest.lat * 10000) / 10000;
        var lat2 = Math.round(bbox.bbox.northEast.lat * 10000) / 10000;
        var lng1 = Math.round(bbox.bbox.southWest.lng * 10000) / 10000;
        var lng2 = Math.round(bbox.bbox.northEast.lng * 10000) / 10000;

        bbox = lng1 + "," + lat1 + "," + lng2 + "," + lat2;
        parameters.bbox = bbox;
    }
    if (events[0]) {
        parameters.events = JSON.stringify(events);
    }
    if (filter[0]) {
        parameters.textfilter = JSON.stringify(filter);
    }
    // create querystring
    var querystring = $.param(parameters);
    // new URL
    window.history.pushState("object or string", "Title", window.location.pathname + "?" + querystring);
}

/**
 * Shows a snackbar on the Top Right
 * @param {String} text to show in the snackbar
 */
function snackbarWithText(text) {
    const date = Date.now();
    $('.snackbar').prepend(
        '<div class="toast ' + date + ' rounded-0" style="border: 1px solid rgb(30,93,136);" ' +
        'role="alert" aria-live="assertive" aria-atomic="true" data-autohide="true" data-delay="3000">' +
        '<div class="toast-header">' +
        '<strong class="mr-auto">' + text + '</strong>' +
        '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">' +
        '<span aria-hidden="true">×</span>' +
        '</button>' +
        '</div>' +
        '</div>');
    $('.toast.' + date).toast('show');
}

function idGenerator() {
    let id = "";
    for (var i = 0; i < 5; ++i) {
        var number = Math.floor(Math.random() * 10);
        id += number;
    }
    return id;
}
