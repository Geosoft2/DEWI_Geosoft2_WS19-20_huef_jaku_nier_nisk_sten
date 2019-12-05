
let socket = io();
const e = React.createElement;
let setTweets= ()=>{};
let getTweets= ()=>{};
let pushTweets= () =>{};

function twitterSandboxSearch(bounds) {
    return new Promise(function (resolve, restrict) {
        $.ajax({
            url: "/api/v1/twitter/sandboxSearch", // URL der Abfrage,
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
        url: "/api/v1/twitter/stream", // URL der Abfrage,
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
        url: '/api/v1/twitter/setStreamFilter',
        // contentType: "application/json",
        dataType: 'json',
        data: bbox
    })
}

class TwitterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tweets: [], timeout: false};
        setTweets = this.setTweets;
        getTweets = this.getTweets;
        pushTweets = this.pushTweets;
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

    tweetClicked = () => {
        console.log("tweetClicked");
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
                    "Coordinates: " + JSON.stringify(item.places.coordinates), e("br"))
                cards.unshift(e(Card, {id: "Card" + item.tweetId},  e(ButtonBase, {onClick: event => self.tweetClicked(event)},  media, content)));
                cards.unshift(e("br"));
            });

            if (this.state.timeout) {
                cards.unshift(e("p", null, "Lost Connection to Twitter Stream. Reconnecting ..."))
            }

            const list=  e(Paper, {id: "list"}, cards)
            return list
        }
}

const domContainer = document.querySelector('#tweets');
ReactDOM.render(e(TwitterList), domContainer);
