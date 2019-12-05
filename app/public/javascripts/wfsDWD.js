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

var extremeWeatherGroup = L.layerGroup();
var warnlayer;
var radarlayer;

/**
 * @desc new extreme weather data are loaded after each change of map-extent
 * @param {json} bounds coordinates of current map-extent
 */
function mapExtendChange(bounds){
  var bbox = boundingbox(bounds);
  var events = $('#selectEvent').val();
  requestExtremeWeather(bbox, events);
}

/**
 * returns an array with boundingboxes smaller than 25x25 miles that cover the whole given bounding box
 * @param bbox a bounding box with a southWest and northEast coordinate
 */
function bboxes(bbox){
    var westOst= meterToMile(distVincenty(bbox.bbox.southWest.lat, bbox.bbox.southWest.lng, bbox.bbox.southWest.lat, bbox.bbox.northEast.lng));
    var nordSued= meterToMile(distVincenty(bbox.bbox.southWest.lat, bbox.bbox.southWest.lng, bbox.bbox.northEast.lat, bbox.bbox.southWest.lng));
    var westOstDiff= Math.ceil(westOst/25);
    var nordSuedDiff= Math.ceil(nordSued/25);
    var boxes=[];
    var lngMultiplicator= (bbox.bbox.northEast.lng - bbox.bbox.southWest.lng)/westOstDiff;
    var latMultiplicator= (bbox.bbox.northEast.lat - bbox.bbox.southWest.lat)/nordSuedDiff;
    boxes.push(westOstDiff);
    for (var i=0; i<westOstDiff; i++){
        for (var j=0; j<nordSuedDiff;j++){
            boxes.push(
                {southWest:{
                lat:bbox.bbox.southWest.lat + j*latMultiplicator,
                lng:bbox.bbox.southWest.lng + i*lngMultiplicator
            },
              northEast:{
                  lat:bbox.bbox.southWest.lat + (j+1)*latMultiplicator,
                  lng:bbox.bbox.southWest.lng + (i+1)*lngMultiplicator
              }
                }
            );
        }
    }
    return boxes;
}

/**
 * @desc creates a json within the current map-extent as coordinates
 * @param {json} bounds coordinates of current map-extent
 * @return json
 */
function boundingbox(bounds){
  return {
    southWest: {
      lat: bounds._southWest.lat,
      lng: bounds._southWest.lng
    },
    northEast: {
      lat: bounds._northEast.lat,
      lng: bounds._northEast.lng
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

function requestEvent(){
  bounds = map.getBounds();
  var bbox = boundingbox(bounds);
  var events = $('#selectEvent').val();
  console.log(events);
  requestExtremeWeather(bbox, events);
}

/**
* @desc queries the extreme weather events based on the current map-extent and add it to the map
* @param {json} bbox coordinates of current map-extent
*/
function requestExtremeWeather(bbox, events){
  $.ajax({
   type: "Get",
   url:  'http://'+location.hostname+':3001/api/v1/mongo/extremeWeather',
   data: {
     events: events,
     bbox: bbox
   }
   // contentType: "application/json",
  })
  .done(function(response) {
    console.log('mongo', response);
    // remove existing layer
    removeExistingLayer(warnlayer);
    // create new layer
    warnlayer = createLayer(response);
    // add layer to layerGroup and map
    extremeWeatherGroup.addLayer(warnlayer).addTo(map);
  })
  .fail(function(err){
    console.log(err.responseText);
  });
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

/**
 * @desc Queries the extreme weather events with predefined bbox and add it to the map - if the page is reloaded. The
 * predefined map extent is about the area of germany. The user has in the settings the possibility to change
 *
 */
 function initialExtremeWeather(){
   // get the new default boundingbox
   var newDefaultBbox = getCookie("defaultBbox");

   // if there is a boundingbox defined by the user it is used, if not the initial bounding box is used
   if (newDefaultBbox != "") {
     newDefaultBbox = JSON.parse(newDefaultBbox);

     var northEastLat = newDefaultBbox.northEast.lat;
     var northEastLng = newDefaultBbox.northEast.lng;
     var southWestLat = newDefaultBbox.southWest.lat;
     var southWestLng = newDefaultBbox.southWest.lng;

     map.fitBounds([[northEastLat, northEastLng], [southWestLat, southWestLng]]);
   }
   else {
     // initial bounding box with the area of germany
     var initialBbox = {
       southWest: {
         lat: 47.2704, // southWest.lng
         lng: 6.6553 // southWest.lat
       },
       northEast: {
         lat: 55.0444, // northEast.lng
         lng: 15.0176 // southWest.lat
       }
     };
     var initialEvents = ['TEST','HEAT','UV','POWERLINEVIBRATION','THAW','GLAZE','FROST','FOG','SNOWDRIFT','SNOWFALL','HAIL','RAIN','TORNADO','WIND','THUNDERSTORM'];
     // "activate" select option
     for(var initialEvent in initialEvents){
       $('#selectEvent option[value='+initialEvents[initialEvent]+']').attr('selected', 'selected');
     }
     requestExtremeWeather(initialBbox, initialEvents);
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
L.control.layers(baseLayers, overLayers, {position: 'topright'}).addTo(map);

/*var selectPickerSpezial;
selectPickerSpezial = '<select class="selectpicker" multiple data-live-search="true"> <option>Mustard</option> <option>Ketchup</option> <option>Relish</option> </select>';*/

/*
settings button for setting the settings menu.
Used label so if you click the text/ description of the checkbox, the checkbox is also checked.
 */
L.easyButton('<i class="fas fa-cog"></i>', function (btn, map) {

    var settings = L.control.window(map, {
        title: 'settings',
        content:
            '<input type="checkbox" id="checkboxMapExtent" onclick="">' +
            '<label for="checkboxMapExtent">set actual map extent as new default map extent</label></p>' +
            '<p><button type="button" id="applyButton" onclick="settingsMenu()">Apply</button></p>' +
            '<p id="settingsAppliedText" style="visibility: hidden;"><b>new settings were applied</b></p>' +
            '<div style="overflow:hidden;"> <select class="selectpicker" data-container="body" style="display: block !important; visibility: visible !important;"> <option value="Mustard">Mustard</option> <option value="Ketchup">Ketchup</option> <option value="Relish">Relish</option></select> </div>' +
            '<select class="selectpicker" multiple data-live-search="true"> <option>Mustard</option> <option>Ketchup</option> <option>Relish</option> </select>' + selectPickerSpezial,
        visible: true,
        modal: true,
        position: 'topRight'
    });

    console.log(document.getElementsByClassName("leaflet-control leaflet-control-window control-window"));
    $(".close").click(function(){
        settings.close();
        console.log(("testddd"));

    });

    document.getElementsByClassName("leaflet-control leaflet-control-window control-window")[0].innerHTML = selectPickerSpezial;

    /*
        document.getElementsByClassName("leaflet-control leaflet-control-window control-window")[0]._leaflet_pos.x = 500;
        document.getElementsByClassName("leaflet-control leaflet-control-window control-window")[0]._leaflet_pos.y = 500;
        console.log(document.getElementsByClassName("leaflet-control leaflet-control-window control-window")[0]._leaflet_pos.x);
    */
    //var x = document.getElementsByClassName("leaflet-control leaflet-control-window control-window");

},  {position: 'topright'}).addTo(map);

/*var selectPickerSpezial = L.DomUtil.create("div");
selectPickerSpezial.innerHTML = '<select class="selectpicker" multiple data-live-search="true"> <option>Mustard</option> <option>Ketchup</option> <option>Relish</option> </select>';
document.getElementsByClassName("content")[0].appendChild(selectPickerSpezial); */



/**
 * @desc function which applies all functions concerning checked checkboxes.
 */
function settingsMenu() {

    var checkBoxMapExtent = document.getElementById("checkboxMapExtent");

    if (checkBoxMapExtent.checked == true) {
        setDefaultMapExtent()
    }

    console.log(document.getElementById("settingsAppliedText").style.visibility);
    // text for confirming the user, that everything was applied
    document.getElementById("settingsAppliedText").style.visibility = "visible";

}

/**
 * @desc function which sets the actual map extent as new map extent.
 */
function setDefaultMapExtent() {
    var cookieValue = JSON.stringify(boundingbox(bounds));
    // cookie to store the map extent
    setCookie("defaultBbox", cookieValue, 1000000);
}

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
function meterToMile(meter){
    return meter*0.0006213712;
}
function toRad(n) {
    return n * Math.PI / 180;
}

/**
 * calculates the distance between two points in meters
 * taken from https://gist.github.com/mathiasbynens/354587
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns {string|number} distance between the two points in meters
 */
function distVincenty(lat1, lon1, lat2, lon2) {
    var a = 6378137,
        b = 6356752.3142,
        f = 1 / 298.257223563, // WGS-84 ellipsoid params
        L = toRad(lon2-lon1),
        U1 = Math.atan((1 - f) * Math.tan(toRad(lat1))),
        U2 = Math.atan((1 - f) * Math.tan(toRad(lat2))),
        sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1),
        sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2),
        lambda = L,
        lambdaP,
        iterLimit = 100;
    do {
        var sinLambda = Math.sin(lambda),
            cosLambda = Math.cos(lambda),
            sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
        if (0 === sinSigma) {
            return 0; // co-incident points
        }
        var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda,
            sigma = Math.atan2(sinSigma, cosSigma),
            sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma,
            cosSqAlpha = 1 - sinAlpha * sinAlpha,
            cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha,
            C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        if (isNaN(cos2SigmaM)) {
            cos2SigmaM = 0; // equatorial line: cosSqAlpha = 0 (§6)
        }
        lambdaP = lambda;
        lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (!iterLimit) {
        return NaN; // formula failed to converge
    }

    var uSq = cosSqAlpha * (a * a - b * b) / (b * b),
        A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
        B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
        deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM))),
        s = b * A * (sigma - deltaSigma);
    return s.toFixed(3); // round to 1mm precision
}
