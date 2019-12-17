
const e = React.createElement;
let setTweets= ()=>{};
let getTweets= ()=>{};
let pushTweets= () =>{};
let setHighlighted=  () => {};

function twitterSandboxSearch(bounds) {
    return new Promise(function (resolve, restrict) {
        $.ajax({
            url: "http://" +location.hostname +':3001/api/v1/social/twitter/posts', // URL der Abfrage,
            data: {
                "bbox": bounds.bbox,
                "filter": ""
            },
            type: "post"
        })
            .done(function (response) {
                console.log(response);
                resolve(response.tweets);
            })
            .fail(function (err) {
                console.log(err)
            })
    })
};

function startStream() {
    $.ajax({
        url: "http://" +location.hostname+':3001/api/v1/social/twitter/stream', // URL der Abfrage,
        data:{},
        type: "get"
    })
        .done(function (response) {
        })
        .fail(function (err) {
            console.log(err)
        });

}

/**
 * updates the TwitterStream with a new boundingbox
 * @param bbox
 */
function updateTwitterStream(bbox) {
    $.ajax({
        type: "POST",
        url: 'http://'+location.hostname+':3001/api/v1/social/twitter/stream',
        // contentType: "application/json",
        dataType: 'json',
        data: bbox
    })
}

class TwitterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tweets: [], timeout: false, highlighted : null};
        setTweets = this.setTweets;
        getTweets = this.getTweets;
        pushTweets = this.pushTweets;
        setHighlighted = this.setHighlighted;

    }

    componentDidMount() {
        this.startSocket();
    }

    setTweets = (tweets) => {
        this.setState({tweets: tweets})
    };

    getTweets = () => {
        return this.state.tweets
    };

    pushTweets= () => {
        const tweets2 = this.state.tweets;
        tweets2.push(tweet);
        this.setState({tweets: tweets2});
    };

    setHighlighted= (coordinates) => {
        this.setState({highlighted: coordinates})
    };

    tweetClicked = (tweet) => {
        this.setHighlighted(tweet.places.coordinates);
        setMarkerColor(tweet.places.coordinates);

    };

    startSocket= () => {
        const self=this;
        socket.on('timeout', function (timeout) {
            self.setState({timeout: timeout})
        });
    }

    /**
    testTwitter = () => {

        const self = this;
        socket.on('tweet', function (tweet) {
            const tweets2 = self.state.tweets;
            tweets2.push(tweet);
            self.setState({tweets: tweets2});
        });
        socket.on('timeout', function (timeout) {
            console.log(timeout);
            self.setState({timeout: timeout})
        });
        /* $.ajax({
             url: "/api/v1/twitter/stream", // URL der Abfrage,
             data:{},
             type: "get"
         })
             .done(function (response) {
             })
             .fail(function (err) {
                 console.log(err)
             });

    } */


        render()
        {
            const  self =this;
            const {
                Card,
                ButtonBase,
                Paper,
                CardContent,
            } = window['MaterialUI'];


            const cards = [];
            cards.unshift(e("br"));

            this.state.tweets.map(function (item, i) {
                const media = [];
                for (var mediaItem of item.media) {
                    if (mediaItem.type === "photo") {
                        media.push(e("img", {src: mediaItem.url, width: 300, height: "auto"}));
                        media.push(e("br"))
                    } else {
                        media.push(e("img", {src: mediaItem.url, width: 300, height: "auto"}));
                        media.push(e("br"))
                    }
                }

                const content= e(CardContent, null,  item.text, e("br"), "Author: " + item.author.name, e("br"),
                    e("a", {href: item.url, target: "_blank"}, "Go to Tweet"), e("br"),
                    "Coordinates: " + JSON.stringify(item.places.coordinates), e("br"));
                let highlighted=null;
                if(JSON.stringify(item.places.coordinates)=== JSON.stringify(self.state.highlighted)){
                    highlighted="highlighted";
                }
                cards.unshift(e(Card, {id: "Card" + item.tweetId, className: highlighted},  e(ButtonBase, {onClick: () => self.tweetClicked(item)},  media, content)));
                cards.unshift(e("br"));
            });

            if (this.state.timeout) {
                cards.unshift(e("p", null, "Lost Connection to Twitter Stream. Reconnecting ..."))
            }

            const list=  e(Paper, {id: "list"}, cards)
            return list
        }
}

/**
 * @desc function which creates a cookie if the button setDefaultSearchWord is pushed.
 */
function setDefaultSearchWord() {
    var searchWord = $('#textFilter').val();
    $('#textFilter').attr("placeholder", "default search word: " + searchWord);
    var cookieValue = JSON.stringify(searchWord);
    setCookie("defaultSearchWord", cookieValue, 1000000);
}

/**
 * @desc function which deletes the defaultSearchWord cookie if the deleteDefaultSearchWord button is pushed.
 */
function deleteDefaultSearchWord() {
    $('#textFilter').attr("placeholder", "search in tweets ...");
    $('#textFilter').val("");
    var name = "defaultSearchWord";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * @desc event, if in the textFilter the "Enter"-key is pressed, a corresponding function id called which starts the
 * twiiter search
 */
$(textFilter).keypress(function(event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
        console.log("keyevent");
        eventsOrFilterChanged();
    }
})

const domContainer = document.querySelector('#tweets');
ReactDOM.render(e(TwitterList), domContainer);
