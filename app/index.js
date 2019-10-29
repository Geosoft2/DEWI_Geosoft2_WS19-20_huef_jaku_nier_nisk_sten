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