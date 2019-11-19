
let socket = io();
const e = React.createElement;

class TwitterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { tweets: []};
    }

    componentDidMount(){
        this.testTwitter()
    }



    testTwitter= () => {

        const self= this;
        socket.on('tweet', function(tweet){
            const tweets2 = self.state.tweets;
            if(tweet.data){
                tweets2.push(tweet.data);
                self.setState({tweets : tweets2});
            }
        });
        $.ajax({
            url: "/twitter/stream", // URL der Abfrage,
            data:{},
            type: "get"
        })
            .done(function (response) {
                console.log(response);
                document.getElementById("twitter").value= JSON.stringify(response);
                $("#twitter").value= JSON.stringify(response);
            })
            .fail(function (err) {
                console.log(err)
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

            this.state.tweets.map(function (item, i) {
                cards.push(e(Card, null, item.text));
                cards.push(e("br", null, null));
            });

        if( cards.length >0) {
            return cards
        }
        else {
            return e("p", null, "")
        }
    }
}

const domContainer = document.querySelector('#tweets');
ReactDOM.render(e(TwitterList), domContainer);
