// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";


// https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geowebservice.pdf?__blob=publicationFile&v=11
var bounds;
var southWestLat;
var southWestLng;
var northEastLat;
var northEastLng;

var mapOptions = {
    center: [51, 10],
    zoom: 6,
    zoomControl: true,
    dragging: true,
    attributionControl: true
};

var map = new L.map('mapWFS', mapOptions);
var osmlayer =  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
});

// Layerlisten für die Layercontrol erstellen und dabei initial aktive Layer zur Karte hinzufügen
var baseLayers = {
    "OpenStreetMap": osmlayer.addTo(map),
    "Esri World Imagery": Esri_WorldImagery.addTo(map)

};

// add pan-control in the bottomleft of the map
L.control.pan({position: 'bottomleft'}).addTo(map);



map.on('moveend', function(e) {
    //funktion wird bei verschieben der Karte ausgelöst
    bounds = map.getBounds();
    mapExtendChange(bounds);
});

// settings
L.easyButton('<i class="fas fa-cog"></i>', function(btn, map){
    {position: 'bottomright'}
    alert('button below');
    if (confirm("set actual map extent as new default map extent")) {

        mapExtendChange(bounds);
        alert(southWestLat + southWestLng + northEastLat + northEastLng);
    } else {
        alert("You pressed Cancel!");
    }

}).addTo(map);

var extremeWeatherGroup = L.layerGroup();
var warnlayer;
var radarlayer;

/**
 * @desc new extreme weather data are loaded after each change of map-extent
 * @param {json} bounds coordinates of current map-extent
 */
function mapExtendChange(bounds){
  var bbox = boundingbox(bounds);
  requestExtremeWeather(bbox);
    southWestLat = bounds._southWest.lat;
    southWestLng = bounds._southWest.lng;
    northEastLat = bounds._northEast.lat;
    northEastLng = bounds._northEast.lng;

    return southWestLat, southWestLng, northEastLat, northEastLng;

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

/**
 * @desc queries the extreme weather events based on the current map-extent and add it to the map
 * @param {json} bbox coordinates of current map-extent
 */
function requestExtremeWeather(bbox){
  $.ajax({
   type: "POST",
   url: '/api/v1/dwd/extremeWeather',
   // contentType: "application/json; charset=utf-8",
   dataType: 'json',
   data: 'bbox='+encodeURIComponent(JSON.stringify(bbox)) // manually serialize()
  })
  .done(function(response) {
    console.log(response);
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

/**
 * @desc checks if layer exists and remove it from map
 * @param {json} layer
 */
function removeExistingLayer(layer){
  if(layer){
    extremeWeatherGroup.removeLayer(layer);
    layer.remove();
  }
}

/**
 * @desc creates a layer from GeoJson
 * @param {geoJson} data
 */
function createLayer(data){
  return L.geoJson(data, {
    style: function (feature) {
      return {
        stroke: false,
        fillColor: 'FFFFFF',
        fillOpacity: 0.5
      };
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup('<h1>'+feature.properties.HEADLINE+'</h1><p>'+feature.properties.NAME+'</p><p>'+feature.properties.DESCRIPTION+'</p>');
    }
  });
}

/**
 * @desc queries the extreme weather events with predefined bbox and add it to the map
 */
function initialExtremeWeather(){
  var bbox = {
    southWest: {
      lat: 47.2704, // southWest.lng
      lng: 6.6553 // southWest.lat
    },
    northEast: {
      lat: 55.0444, // northEast.lng
      lng: 15.0176 // southWest.lat
    }
  };
  requestExtremeWeather(bbox);
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



