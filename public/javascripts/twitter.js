var socket = io();

function testTwitter(){

    socket.on('tweet', function(tweet){
        console.log(tweet);
        document.getElementById("twitter").value= JSON.stringify(tweet);
    });
    $.ajax({
        url: "/twitter/search", // URL der Abfrage,
        data:{"bbox" : {
                "southWest": {"lat": 52.46228526678029 , "lng": 13.270111083984375},
                "northEast": {"lat": 52.56842095734828 , "lng": 13.493957519531248}},
            "filter" : "rain",
            "since" : 21600},
        type: "post"
    })
        .done(function (response) {
            console.log(response);
            document.getElementById("twitter").value= JSON.stringify(response);
            $("#twitter").value= JSON.stringify(response);
        })
        .fail(function (err) {
        console.log(err)
    })


}
