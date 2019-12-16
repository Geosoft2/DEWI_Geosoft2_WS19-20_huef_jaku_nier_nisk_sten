
const e = React.createElement;
let setTweets= ()=>{};
let getState= ()=>{};
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

/**

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
 */

/**
 * updates the TwitterStream with a new boundingbox
 * @param bbox
 */
function updateTwitterStream(bbox, keyword) {
    $.ajax({
        type: "POST",
        url: 'http://'+location.hostname+':3001/api/v1/social/twitter/stream',
        // contentType: "application/json",
        dataType: 'json',
        data: {bbox :bbox, keyword: keyword}
    })
}

class TwitterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tweets: [], timeout: false, highlighted : null};
        setTweets = this.setTweets;
        getState = this.getState;
        pushTweets = this.pushTweets;
        setHighlighted = this.setHighlighted;

    }

    componentDidMount() {
        this.startSocket();
    }

    setTweets = (tweets) => {
        this.setState({tweets: tweets})
    };

    getState = (state) => {
        return this.state[state]
    };

    goToTweet = (url) =>{
        window.open(url);
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
        if(JSON.stringify(this.state.highlighted)=== JSON.stringify(tweet.places.coordinates)){
            this.setHighlighted(null);
            setMarkerColor(null);
        }
        else {
            this.setHighlighted(tweet.places.coordinates);
            setMarkerColor(tweet.places.coordinates);
        }
    };

    startSocket= () => {
        const self=this;
        socket.on('timeout', function (timeout) {
            self.setState({timeout: timeout})
        });
    };

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
                CardHeader,
                Avatar,
                IconButton,
                Icon,
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

                const avatar = e(Avatar, {src: item.author.profileImage, className:"avatar"});
                const header= e(CardHeader, {avatar: avatar,
                        className: "header",
                        title: e("a", {href: item.author.url, target: "_blank"}, item.author.name, ),
                        subheader: item.createdAt,
                        action: e(IconButton, {onClick: ()=> self.goToTweet(item.url)}, e("i", {className: "fab fa-twitter icon", "aria-hidden":"true"}))});
                const content= e(CardContent, null,  item.text);
                let highlighted=null;
                if(JSON.stringify(item.places.coordinates)=== JSON.stringify(self.state.highlighted)){
                    highlighted="highlighted";
                }
                else{
                    highlighted="cards"
                }
                const card = e(Card, {id: "Card" + item.tweetId, className: highlighted}, header, media, content);
                cards.unshift(e("div", null, e(ButtonBase, {className: "cards", onClick: () => self.tweetClicked(item)}, card,)));
                cards.unshift(e("br"));
            });

            if (this.state.timeout) {
                cards.unshift(e("p", null, "Lost Connection to Twitter Stream. Reconnecting ..."))
            }

            const list=  e(Paper, {id: "list"}, cards);
            return list
        }
}

const domContainer = document.querySelector('#tweets');
ReactDOM.render(e(TwitterList), domContainer);
