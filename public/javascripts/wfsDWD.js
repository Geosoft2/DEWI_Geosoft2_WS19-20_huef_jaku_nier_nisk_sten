// leaflet
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
});
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

var rootUrl = 'https://maps.dwd.de/geoserver/dwd/ows';
// https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=dwd:Warnungen_Gemeinden

var defaultParameters = {
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: 'dwd:Warnungen_Gemeinden',
    // maxFeatures: 200,
    outputFormat: 'application/json',
    // srsName:'EPSG:28992'
};

var parameters = L.Util.extend(defaultParameters);
var URL = rootUrl + L.Util.getParamString(parameters);

var wfsLayers=[];
var ajax = $.ajax({
    url : URL,
    dataType : 'json',
    jsonpCallback : 'getJson',
    success : function (response) {
        warnlayer = L.geoJson(response, {
            style: function (feature) {
                return {
                    stroke: false,
                    fillColor: 'FFFFFF',
                    fillOpacity: 0.5
                };
            },
            onEachFeature: function (feature, layer) {
                wfsLayers.push(feature);
              layer.bindPopup('<h1>'+feature.properties.HEADLINE+'</h1><p>'+feature.properties.NAME+'</p><p>'+feature.properties.DESCRIPTION+'</p>');
            }
      });
        //console.log(wfsLayers);

      var overLayers = {
          "<span title='Wetter- und Unwetterwarnungen einblenden'>Warnungen einblenden</span>": warnlayer.addTo(map)
      };
      // Layercontrol-Element erstellen und hinzufügen
      L.control.layers(baseLayers, overLayers).addTo(map);
    }
});

/**
 * gibt die wfsLayer als JSON in einem Textfeld zurück
 */
function testWfsLayer(){
    document.getElementById("wfsJson").value= JSON.stringify(wfsLayers);
}

/**
 * Funktion, die nach ändern des Kartenauschnittes aufgerufen wird
 * @param bounds    beinhaltet die Kordinaten der Bounding Box des aktuellen mapextends
 */

function mapExtendChange(bounds){
        alert("Die Karte wurde verschoben, die neue Bounding Box hat die Koordinaten "
        +bounds._southWest.lat +" lat, "+ bounds._southWest.lng +" lng und " +bounds._northEast.lat +" lat, "
        +bounds._northEast.lng +" lng.")
        southWestLat = bounds._southWest.lat;
        southWestLng = bounds._southWest.lng;
        northEastLat = bounds._northEast.lat;
        northEastLng = bounds._northEast.lng;

        return southWestLat, southWestLng, northEastLat, northEastLng;
}
