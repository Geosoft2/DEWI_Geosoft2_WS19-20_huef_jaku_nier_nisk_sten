
const e = React.createElement;
let setTweets= ()=>{};
let getState= ()=>{};
let pushTweets= () =>{};
let setHighlighted=  () => {};

function twitterSandboxSearch(bounds, filter) {

    let words= [];
    while(filter.indexOf(" ") !== -1){
        const word= filter.substring(0, filter.indexOf(" "));
        filter =filter.substring(filter.indexOf(" ") +1 , filter.length);
        words.push(word);
    }
    words.push(filter);
    return new Promise(function (resolve, restrict) {
        console.log(bounds);
        $.ajax({
            url: "http://" +location.hostname +':3001/api/v1/social/twitter/posts', // URL der Abfrage,
            data: {
                "bbox": bounds.bbox,
                "filter": words
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
        tweets.sort((a,b) => {return new Date(a.createdAt) - new Date(b.createdAt)})
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

    setHighlighted= (coordinates, scroll) => {
        this.setState({highlighted: coordinates}, () =>{
            if(scroll){
                var element = document.getElementsByClassName("highlighted");
                if(element[0]) {element[0].scrollIntoView()};
            }
        })
    };

    tweetClicked = (tweet) => {
        const coordinates = {lat: tweet.geometry.coordinates[1], lng: tweet.geometry.coordinates[0]};
        if(JSON.stringify(this.state.highlighted)=== JSON.stringify(coordinates)){
            this.setHighlighted(null);
            setMarkerColor(null);
        }
        else {
            this.setHighlighted(coordinates);
            setMarkerColor(coordinates);
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
                var place = e("span", null, "");

           
                if(item.place){
                 place= e("span", null, " Place: "+ item.place.name)
                }
            

                const avatar = e(Avatar, {src: item.author.profileImage, className:"avatar"});
                const header= e(CardHeader, {avatar: avatar,
                        className: "header",
                        title: e("a", {href: item.author.url, target: "_blank"}, item.author.name, ),
                        subheader: e("span", null, "Created at: "+ item.createdAt , e("br") , e("span", null, "Accuracy: " + item.accuracy + " km", place)) ,
                        action: e(IconButton, {onClick: ()=> self.goToTweet(item.url)}, e("i", {className: "fab fa-twitter icon", "aria-hidden":"true"}))});
                const content= e(CardContent, null,  item.text);
                let highlighted=null;
                const coordinates = {lat: item.geometry.coordinates[1], lng: item.geometry.coordinates[0]};
                if(JSON.stringify(coordinates)=== JSON.stringify(self.state.highlighted)){
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
