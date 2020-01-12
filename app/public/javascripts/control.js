// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";
let wfsLayer;

/**
 * @desc Intial function which starts when the page is loaded
 * @param {*} boundingbox to set the map extend to
 * @param {*} events weather events to show in the map
 * @param {*} filter initial filter to search the tweets after
 */
async function initial (boundingbox, events, filter) {

    document.getElementById("progressbar").value =25;
    events = getInitialEvents(events);

    // "activate" select option
  for(var initialEvent in events){
    $('#selectEvent option[value='+events[initialEvent]+']').attr('selected', 'selected');
  }

  filter = getInitialFilter(filter);

  startSocket();
  let twitterResponse;


  var bbox = getInitialBbox(boundingbox);


  if (bbox) {
      updateTwitterStream(bbox, filter);
      // Start 2 "jobs" in parallel and wait for both of them to complete
      await Promise.all([
          (async()=>wfsLayer = await requestExtremeWeather(bbox, events))(),
          (async()=>twitterResponse = await twitterSearch(bbox, filter))() //TODO: get the tweets from mongodb and not direct from Twitter
      ]);
  addTweets(wfsLayer, twitterResponse, bbox);
  }
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

    if(events) {
        return JSON.parse(events);
    }

    if (newDefaultEvents!="") {
        return JSON.parse(newDefaultEvents);
    }
    else  {
        events = ['TEST','HEAT','UV','POWERLINEVIBRATION','THAW','GLAZE','FROST','FOG','SNOWDRIFT','SNOWFALL','HAIL','RAIN','TORNADO','WIND','THUNDERSTORM'];
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

   if(filter) {
     $('#textFilter').val(filter);
     return filter;
   }
   else if (newDefaultFilter!="") {
     newDefaultFilter = JSON.parse(newDefaultFilter);
     $('#textFilter').val(newDefaultFilter);
     $('#textFilter').attr("placeholder", "default search word: " + newDefaultFilter);
     return newDefaultFilter;
   }
   else  {
     return filter;
   }
 }


/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
 function getInitialBbox(bbox) {

   if(bbox){
     getBoundingBoxFromUrl(bbox);
     return null;
   }
   else if(getBoundingBboxFromCookie()) {
     return (null);
   }
   else {
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

    const delay = ms => new Promise(res => setTimeout(res, ms));
    document.getElementById("progressbar").value =25;
    document.getElementById("progressbar").style.visibility='visible';
    // TODO: uncomment updateTwitterStream after setStreamfilter works

    var events = $('#selectEvent').val();
    var filter = $('#textFilter').val();
    updateTwitterStream(bounds, filter);
    const tweets= getState('tweets');
    removeTweets(wfsLayer, bounds);
    updateURL(bounds, events, filter);
    let twitterResponse;
    await Promise.all([
        (async()=>wfsLayer = await requestExtremeWeather(bounds, events))(),
        (async()=>twitterResponse = await twitterSearch(bounds, filter))(),//TODO: get the tweets from mongodb and not direct from Twitter
    ]);
    addTweets(wfsLayer, twitterResponse, bounds)
}

/**
 * @desc new extreme weather data and tweets are loaded after each change of the events or filter
 */
async function eventsOrFilterChanged() {
  var bounds = map.getBounds();
  bounds = boundingbox(bounds);
    var events = $('#selectEvent').val();
    var filter = $('#textFilter').val();
    updateTwitterStream(bounds, filter);
    updateURL(bounds, events, filter);
    let twitterResponse;
    removeAllTweets();
    await Promise.all([
        (async()=>wfsLayer = await requestExtremeWeather(bounds, events))(),
        (async()=>twitterResponse = await twitterSandboxSearch(bounds, filter))(),//TODO: get the tweets from mongodb and not direct from Twitter
    ]);
    addTweets(wfsLayer, twitterResponse, bounds)
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
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * @desc Creates some Socket-Client Listener
 */
 function startSocket() {
    socket.on('tweet', function (tweet) {
        var bounds = map.getBounds();
        bounds = boundingbox(bounds);
        console.log(tweet);
        addTweets(wfsLayer, [tweet], bounds)
    });
    socket.on('weatherchanges', async function (data) {
        var bounds = map.getBounds();
        bounds = boundingbox(bounds);
        console.log('Weather changed');
        console.log(data.stats);
        var events = $('#selectEvent').val();
        var filter = $('#textFilter').val();
        removeTweets(wfsLayer, bounds);
        let twitterResponse;
        await Promise.all([
            (async()=>wfsLayer = await requestExtremeWeather(bounds, events))(),
            (async()=>twitterResponse = await twitterSandboxSearch(bounds, filter))(),//TODO: get the tweets from mongodb and not direct from Twitter
        ]);
        removeTweets(wfsLayer, bounds);
        addTweets(wfsLayer, twitterResponse, bounds);
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

  if(bbox){
    // URL has to be updated by filter to
    var lat1 = Math.round(bbox.bbox.southWest.lat * 10000) / 10000;
    var lat2 = Math.round(bbox.bbox.northEast.lat * 10000) / 10000;
    var lng1 = Math.round(bbox.bbox.southWest.lng * 10000) / 10000;
    var lng2 = Math.round(bbox.bbox.northEast.lng * 10000) / 10000;

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

/**
 * Shows a snackbar on the Top Right
 * @param {String} text to show in the snackbar
 */
function snackbarWithText(text) {
    const date = Date.now()
    $('.snackbar').prepend(
        '<div class="toast '+date+' rounded-0" style="border: 1px solid rgb(232,89,23);" ' +
        'role="alert" aria-live="assertive" aria-atomic="true" data-autohide="true" data-delay="3000">'+
        '<div class="toast-header">'+
        '<span class="fa fa-star mr-2" style="color: rgb(232,89,23);"></span>'+
        '<strong class="mr-auto">'+text +'</strong>'+
        '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">'+
        '<span aria-hidden="true">×</span>'+
        '</button>'+
        '</div>'+
        // '<div class="toast-body">'+
        //   'Some Toast Body'+
        // '</div>'+
        '</div>');
    $('.toast.'+date).toast('show');

}