var socket = io();

function testTwitter(){

    socket.on('tweet', function(tweet){
        console.log(tweet);
        document.getElementById("twitter").value= JSON.stringify(tweet);
    });
    $.ajax({
        url: "/twitter/stream", // URL der Abfrage,
        data: {},
        type: "get"
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
