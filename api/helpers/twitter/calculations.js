const turf = require('@turf/turf');

/**
 * calculates an array of circles that covers the given bounding box
 * @param bbox
 * @returns {[]} array with circles that have a center (lat/lng) and a radius
 * */
function getRadii(bbox){
    var westOst= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.southWest.lat, bbox.northEast.lng));
    var nordSued= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.northEast.lat, bbox.southWest.lng));
    var westOstDiff= Math.ceil(westOst/100);
    var nordSuedDiff= Math.ceil(nordSued/100);
    var boxes=[];
    var lngMultiplicator= (bbox.northEast.lng - bbox.southWest.lng)/westOstDiff;
    var latMultiplicator= (bbox.northEast.lat - bbox.southWest.lat)/nordSuedDiff;
    for (var i=0; i<(westOstDiff+1); i++){
        for (var j=0; j<(nordSuedDiff+1);j++){
            var lat= +bbox.southWest.lat + j*latMultiplicator;
            var lng= +bbox.southWest.lng + i*lngMultiplicator;
            var a={center:{
                    lat:lat,
                    lng:lng
                },
                radius: mileToMeter(71)/1000

            };
            if (circleIntersectsWithGermany(a)){
                boxes.push(a);
            }
        }
    }
    return boxes;
}

function circleIntersectsWithGermany(circles) {
    var boundingboxGermany= turf.polygon([[
        [45.967, 5.867],
        [55.133, 5.867],
        [55.133, 15.033],
        [45.967, 15.033],
        [45.967, 5.867]
    ]]);
    var options = {steps: 10, units: 'meters', properties: {foo: 'bar'}};
    var a=turf.circle([circles.center.lat,circles.center.lng],circles.radius, options);
    return !turf.booleanDisjoint(a, boundingboxGermany);
}

/**
 * calculates an array of 25x25 boxes that cover the given bounding box
 * @param bbox
 * @returns {[]} array with boxes that have a southWest (lat/lng) and a northEast (lat/lng) corner
 */
function bboxes(bbox){
    var westOst= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.southWest.lat, bbox.northEast.lng));
    var nordSued= meterToMile(distVincenty(bbox.southWest.lat, bbox.southWest.lng, bbox.northEast.lat, bbox.southWest.lng));
    var westOstDiff= Math.ceil(westOst/25);
    var nordSuedDiff= Math.ceil(nordSued/25);
    var boxes=[];
    var lngMultiplicator= (bbox.northEast.lng - bbox.southWest.lng)/westOstDiff;
    var latMultiplicator= (bbox.northEast.lat - bbox.southWest.lat)/nordSuedDiff;
    for (var i=0; i<westOstDiff; i++){
        for (var j=0; j<nordSuedDiff;j++){
            boxes.push(
                {southWest:{
                        lat:bbox.southWest.lat + j*latMultiplicator,
                        lng:bbox.southWest.lng + i*lngMultiplicator
                    },
                    northEast:{
                        lat:bbox.southWest.lat + (j+1)*latMultiplicator,
                        lng:bbox.southWest.lng + (i+1)*lngMultiplicator
                    }
                }
            );
        }
    }
    return boxes;

}

/**
 * Calculates meter to miles
 * @param  meter 
 * @returns miles
 */
function meterToMile(meter){
    return meter*0.0006213712;
}

/**
 * Calculates miles to meters
 * @param mile 
 * @returns meters
 */
function mileToMeter(mile) {
    return mile/0.0006213712;
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

module.exports ={
    getRadii,
    bboxes,
};