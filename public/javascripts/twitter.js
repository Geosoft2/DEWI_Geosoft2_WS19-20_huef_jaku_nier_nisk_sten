
let socket = io();
const e = React.createElement;

class TwitterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { tweets: [], timeout: false};
    }

    componentDidMount(){
        this.testTwitter()
    }

    testTwitter= () => {

        const self= this;
        socket.on('tweet', function(tweet){
            const tweets2 = self.state.tweets;
            tweets2.push(tweet);
            self.setState({tweets : tweets2});
        });
        socket.on('timeout', function (timeout){
            console.log(timeout)
            self.setState({timeout : timeout})
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
        */
        $.ajax({
            url: "/api/v1/twitter/search", // URL der Abfrage,
            data:{"bbox" : {
                    "southWest": {"lat": 52.46228526678029 , "lng": 13.270111083984375},
                    "northEast": {"lat": 52.56842095734828 , "lng": 13.493957519531248}},
                "filter" : "rain",
                "since" : 21600},
            type: "post"
        })
            .done(function (response) {
                self.setState({tweets: response.tweets})
            })
            .fail(function (err) {
                console.log(err)
            })
    };

    render() {

        const {
            Card
        } = window['MaterialUI'];

        const cards=[];
        cards.unshift(e("br"));

            this.state.tweets.map(function (item, i) {
                const media=[];
                for(var mediaItem of item.media){
                   /* if(mediaItem.type ==="video"){
                        media.push(e("video", {width:300, height: "auto"}, e("source", {src:mediaItem.url, type: "video/" +mediaItem.url.substr(mediaItem.url.length-3, 3)})))
                    }*/
                    media.push(e("img", {src: mediaItem.url, width:300, height: "auto"}))
                }
                cards.unshift(e(Card, null, item.text,  e("br"), "Author: " + item.author.name, e("br"),
                    e("a", {href: item.url, target: "_blank"}, "Go to Tweet"), e("br"),
                    "Coordinates: " + JSON.stringify(item.places.coordinates), e("br"), media));
                cards.unshift(e("br", null, null));
            });

        if(this.state.timeout){
            cards.unshift(e("p",null,"Lost Connection to Twitter Stream. Reconnecting ..."))
        }

        return cards
    }
}

const domContainer = document.querySelector('#tweets');
ReactDOM.render(e(TwitterList), domContainer);
