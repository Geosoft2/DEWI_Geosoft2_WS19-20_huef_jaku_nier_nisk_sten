function testTwitter(){

    $.ajax({
        url: "/twitter/search", // URL der Abfrage,
        data: {},
        type: "get"
    })
        .done(function (response) {
            console.log(response);
            document.getElementById("twitter").value= JSON.stringify(response);
            $("#twitter").value= JSON.stringify(response)
        })


}

// leaflet
var mapOptions = {
    center: [51, 10],
    zoom: 6,
    zoomControl: true,
    dragging: true,
    attributionControl: true
};
var map = new L.map('map', mapOptions);
var osmlayer =  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
});

// Warnungs-Layer vom DWD-Geoserver - betterWms fügt Möglichkeiten zur GetFeatureInfo hinzu
var warnlayer = L.tileLayer.betterWms("https://maps.dwd.de/geoproxy_warnungen/service/", {
    layers: 'Warnungen_Gemeinden_vereinigt',
    // eigene Styled Layer Descriptor (SLD) können zur alternativen Anzeige der Warnungen genutzt werden (https://docs.geoserver.org/stable/en/user/styling/sld/reference/)
    //sld: 'https://eigenerserver/alternativer.sld',
    format: 'image/png',
    transparent: true,
    opacity: 0.8,
    attribution: 'Warndaten: &copy; <a href="https://www.dwd.de">DWD</a>'
});

// Layerlisten für die Layercontrol erstellen und dabei initial aktive Layer zur Karte hinzufügen
var baseLayers = {
    "OpenStreetMap": osmlayer.addTo(map)
};
if (warnlayer) {
    var overLayers = {
        "<span title='Wetter- und Unwetterwarnungen einblenden'>Warnungen einblenden</span>": warnlayer.addTo(map),
    };
}

// Layercontrol-Element erstellen und hinzufügen
L.control.layers(baseLayers, overLayers).addTo(map);

function testDwd(){
    // funktion um die API des dwd zu testen
    // mögliche sinnvolle Links:
    // https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json
    // https://opendata.dwd.de/weather/
    if (warnlayer){
        console.log(warnlayer);
        document.getElementById("dwd").value= warnlayer;
    }
}