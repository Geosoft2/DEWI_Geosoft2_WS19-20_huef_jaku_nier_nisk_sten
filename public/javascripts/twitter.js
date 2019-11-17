var socket = io();

function testTwitter(){

    socket.on('tweet', function(tweet){
        console.log(tweet);
        document.getElementById("twitter").value= JSON.stringify(tweet);
    });
    $.ajax({
        url: "/twitter/search", // URL der Abfrage,
        data: {"filter" : "rain"},
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
