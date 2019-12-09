// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";
let wfsLayer;

async function initial (bbox, events, filter) {
  // TODO: checking parameter serverside or clientside??
  //- longitute: max 180.0, min -180.0
  // - latitude: max 90.0, min -90.0
  var regEx = /^\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*,\s*(-?(([0-9]{1,2}|[1][0-7][0-9])(\.[0-9]*)?|180(\.0*)?))\s*,\s*(-?(([0-9]|[0-8][0-9])(\.[0-9]*)?|90(\.0*)?))\s*$/;
  if(!(bbox && regEx.test(bbox))){
    bbox = getInitialBbox();
  }

  if(!events) {
    events = ['TEST','HEAT','UV','POWERLINEVIBRATION','THAW','GLAZE','FROST','FOG','SNOWDRIFT','SNOWFALL','HAIL','RAIN','TORNADO','WIND','THUNDERSTORM'];
  }
  else{
    events = JSON.parse(events);
  }
  // "activate" select option
  for(var initialEvent in events){
    $('#selectEvent option[value='+events[initialEvent]+']').attr('selected', 'selected');
  }

  // if(!filter) {console.log('filter', filter);}

  startStream();
  startSocket();
  let twitterResponse;
  if (bbox) {
      // Start 2 "jobs" in parallel and wait for both of them to complete
      await Promise.all([
          (async()=>wfsLayer = await requestExtremeWeather(bbox, events))(),
          (async()=>twitterResponse = await twitterSandboxSearch(bbox))() //TODO: get the tweets from mongodb and not direct from Twitter
      ]);
  addTweets(wfsLayer, twitterResponse, bbox);
  }
}

/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
function getInitialBbox() {

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
        var newDefaultBbox = getWindowCoordsFromUrl();

        if(newDefaultBbox == "") {

            if (getBoundingBboxFromCookie()) {
                return (null);
            }
            else {
                return (initialBbox);
            }

        }
}

function getBoundingBboxFromCookie() {
    var newDefaultBbox = getCookie("defaultBbox");

    if (newDefaultBbox != "") {
        newDefaultBbox = JSON.parse(newDefaultBbox);
    }

    // if there is a boundingbox defined by the user it is used, if not the initial bounding box is used
    if (newDefaultBbox != "") {

        var northEastLat = newDefaultBbox.bbox.northEast.lat;
        var northEastLng = newDefaultBbox.bbox.northEast.lng;
        var southWestLat = newDefaultBbox.bbox.southWest.lat;
        var southWestLng = newDefaultBbox.bbox.southWest.lng;

        map.fitBounds([[northEastLat, northEastLng], [southWestLat, southWestLng]]);
        return (true);
    }
    return (false);
}

map.on('moveend', function (e) {
    // function which is triggered automatically when the map gets moved
    var bounds = map.getBounds();
    bounds = boundingbox(bounds);
    console.log(bounds);
    mapExtendChange(bounds);
});

/**
 * @desc new extreme weather data are loaded after each change of map-extent
 * @param {json} bounds coordinates of current map-extent
 */
async function mapExtendChange(bounds) {
    // TODO: uncomment updateTwitterStream after setStreamfilter works
    //await updateTwitterStream(bbox.bbox);
    var events = $('#selectEvent').val();
    removeTweets(wfsLayer, bounds);
    updateURL(bounds, events);
    let twitterResponse;
    await Promise.all([
        (async()=>wfsLayer = await requestExtremeWeather(bounds, events))(),
        (async()=>twitterResponse = await twitterSandboxSearch(bounds))(),//TODO: get the tweets from mongodb and not direct from Twitter
    ]);
    addTweets(wfsLayer, twitterResponse, bounds)
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

function startSocket() {
    socket.on('tweet', function (tweet) {
        var bounds = map.getBounds();
        bounds = boundingbox(bounds);
        console.log(tweet);
        addTweets(wfsLayer, [tweet], bounds)
    });
}

function getWindowCoordsFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('bbox');
    console.log(myParam);
    if (myParam == null) {
        return "";
    }
    const coords = myParam.split(',');
    console.log(coords);
    return {
        bbox: {
            southWest: {
                lat: parseFloat(coords[1]),
                lng: parseFloat(coords[0])
            },
            northEast: {
                lat: parseFloat(coords[3]),
                lng: parseFloat(coords[2])
            }
        }
    };
}

function updateURL(bbox, events, filter) {

  var parameters = {};

  if(bbox){
    // URL has to be updated by filter to
    var lat1 = Math.round(bbox.bbox.southWest.lat * 10000) / 10000;
    var lat2 = Math.round(bbox.bbox.northEast.lat * 10000) / 10000;
    var lng1 = Math.round(bbox.bbox.southWest.lng * 10000) / 10000;
    var lng2 = Math.round(bbox.bbox.northEast.lng * 10000) / 10000;
    console.log(events);
    bbox = lng1 + "," + lat1 + "," + lng2 + "," + lat2;
    parameters.bbox = bbox;
  }
  if(events[0]){
    parameters.events = JSON.stringify(events);
  }
  if(filter){
    parameters.textfilter = filter;
  }
  // create querystring
  var querystring = $.param(parameters);
  // new URL
  window.history.pushState("object or string", "Title", "/?" + querystring);
}
