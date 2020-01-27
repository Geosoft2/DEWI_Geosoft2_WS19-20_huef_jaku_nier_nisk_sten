"use strict";
let setTweets;
let getState = () => {
};
let pushTweets = () => {
};
let setHighlighted = () => {
};

/**
 * Search for tweets and show them in the List
 * @param {JSON} bounds where the tweest must be in
 * @param {array} filter array of keyword to filter the tweets after
 */
function twitterSearch(bounds, filter, extremeWeatherEvents) {

    return new Promise(function (resolve, restrict) {
        const TID = "T" + idGenerator();
        const date = new Date(Date.now());
        addRequest({id: TID, send: date.toUTCString(), status: "Pending"});
        $.ajax({
            url: "http://" + location.hostname + ':3001/api/v1/social/twitter/posts', // URL der Abfrage,
            headers: {
                "Content-Type": "application/json",
                'X-Request-Id': TID
            },
            data: JSON.stringify({
                "bbox": bounds.bbox,
                "filter": filter,
                "extremeWeatherEvents": extremeWeatherEvents
            }),
            type: "post"
        })
            .done(function (response) {
                addRequest({id: TID, send: date.toUTCString(), status: "Success"});
                resolve(response.tweets);
            })
            .fail(function (err) {
                addRequest({id: TID, send: date.toUTCString(), status: "Failed"});
                console.log(err);
            });
    });
}


/**
 * Search for tweets and show them in the List
 * @param {JSON} bounds where the tweest must be in
 * @param {array} filter array of keyword to filter the tweets after
 */
function twitterSearchOne(bounds, filter, extremeWeatherEvents, id) {

    return new Promise(function (resolve, restrict) {
        const TID = "T" + idGenerator();
        const date = new Date(Date.now());
        addRequest({id: TID, send: date.toUTCString(), status: "Pending"});
        $.ajax({
            url: "http://" + location.hostname + ':3001/api/v1/social/twitter/posts/' + id, // URL der Abfrage,
            headers: {
                "Content-Type": "application/json",
                'X-Request-Id': TID
            },
            data: JSON.stringify({
                "bbox": bounds.bbox,
                "filter": filter,
                "extremeWeatherEvents": extremeWeatherEvents
            }),
            type: "post"
        })
            .done(function (response) {
                addRequest({id: TID, send: date.toUTCString(), status: "Success"});
                resolve(response.tweet);
            })
            .fail(function (err) {
                addRequest({id: TID, send: date.toUTCString(), status: "Failed"});
                console.log(err);
            });
    });
}

class TwitterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tweets: [], timeout: false, highlighted: null};
        setTweets = this.setTweets.bind(this);
        getState = this.getState.bind(this);
        pushTweets = this.pushTweets.bind(this);
        setHighlighted = this.setHighlighted.bind(this);

    }

    /**
     * @desc Function wich starts when the page is loaded
     */
    componentDidMount() {
        this.startSocket();
    }

    /**
     * @desc Shows tweets in the List
     * @param {JSON} tweet to be displayerd
     */
    setTweets(tweets) {
        //sort Tweets
        tweets.sort(function (a, b) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        this.setState({tweets: tweets});
    }

    /**
     * @desc Returns the current value of the variable
     * @param {string} state name of the variable to return
     * @return {*} value of the Parameter
     */
    getState(state) {
        return this.state[state];
    }

    /**
     * @desc Opens a Link in a new Tab
     * @param {String} Link to go to
     */
    goToTweet(url) {
        window.open(url);
    }

    /**
     * @desc Adds a tweet to the List
     * @param {JSON} tweet to add
     */
    pushTweets(tweet) {
        const tweets2 = this.state.tweets;
        tweets2.push(tweet);
        this.setState({tweets: tweets2});
    }

    /**
     * @desc Highlites a Tweet and scroll eventually to it
     * @param {JSON} coordinates of wich Tweet shoul be highlited
     * @param {Boolean} scroll boolean if to the tweet should be scrolled
     */
    setHighlighted(coordinates, scroll) {
        this.setState({highlighted: coordinates}, () => {
            if (scroll) {
                var element = document.getElementsByClassName("highlighted");
                if (element[0]) {
                    element[0].scrollIntoView();
                }
            }
        });
    }

    /**
     * @desc Event handler if a tweet was clicked
     * @param {JSON} tweet that was clicked
     */
    tweetClicked(tweet) {
        const coordinates = {lat: tweet.geometry.coordinates[1], lng: tweet.geometry.coordinates[0]};
        if (JSON.stringify(this.state.highlighted) === JSON.stringify(coordinates)) {
            this.setHighlighted(null);
            setMarkerColor(null);
        } else {
            this.setHighlighted(coordinates);
            setMarkerColor(coordinates);
        }
    }

    /**
     * @desc Starts a socket listener
     */
    startSocket() {
        const self = this;
        socket.on('timeout', function (timeout) {
            self.setState({timeout: timeout});
        });
    }


    render() {
        const self = this;
        const {
            Card,
            ButtonBase,
            Paper,
            CardContent,
            CardHeader,
            Avatar,
            IconButton,
        } = window['MaterialUI'];

        const cards = [];
        cards.unshift(e("br"));

        var errText = [];

        if (this.state.timeout) {
            errText.push(e("p", null, "Lost Connection to Twitter Stream. Reconnecting ..."));
        }

        if (this.state.tweets.length !== 0) {
            this.state.tweets.map(function (item) {
                const media = [];
                for (var mediaItem of item.media) {
                    if (mediaItem.type === "photo") {
                        media.push(e("img", {src: mediaItem.url, width: 300, height: "auto"}));
                        media.push(e("br"));
                    } else {
                        media.push(e("img", {src: mediaItem.url, width: 300, height: "auto"}));
                        media.push(e("br"));
                    }
                }
                var place = e("span", null, "");


                if (item.place) {
                    place = e("span", null, " Place: " + item.place.name);
                }


                const avatar = e(Avatar, {src: item.author.profileImage, className: "avatar"});
                const header = e(CardHeader, {
                    avatar: avatar,
                    className: "header",
                    title: e("a", {href: item.author.url, target: "_blank"}, item.author.name,),
                    subheader: e("span", null, "Created at: " + item.createdAt, e("br"), e("span", null, "Accuracy: " + item.accuracy + " km", place)),
                    action: e(IconButton, {onClick: () => self.goToTweet(item.url)}, e("i", {
                        className: "fab fa-twitter icon",
                        "aria-hidden": "true"
                    }))
                });
                const content = e(CardContent, null, item.text);
                let highlighted;
                const coordinates = {lat: item.geometry.coordinates[1], lng: item.geometry.coordinates[0]};
                if (JSON.stringify(coordinates) === JSON.stringify(self.state.highlighted)) {
                    highlighted = "highlighted";
                } else {
                    highlighted = "cards";
                }
                const card = e(Card, {id: "Card" + item.tweetId, className: highlighted}, header, media, content);
                cards.unshift(e("div", null, e(ButtonBase, {
                    className: "cards",
                    onClick: () => self.tweetClicked(item)
                }, card,)));
                cards.unshift(e("br"));
            });
        } else {
            errText.push(e("p", null, "No tweets in extreme weather areas available!"));
        }

        const list = e(Paper, {id: "list", style: {"max-height": "60vh"}}, cards);
        return e("div", null, errText, list);
    }
}

/**
 * @desc function which creates a cookie if the button setDefaultSearchWord is pushed.
 */
function setDefaultSearchWord() {
    var searchWord = getTweetFilters();
    // $('#textFilter').attr("placeholder", "default search word: " + searchWord);
    var cookieValue = JSON.stringify(searchWord);
    setCookie("defaultSearchWord", cookieValue, 1000000);
    snackbarWithText('Successfully set new tweet filter.');
}


/**
 * @desc function which sets the search word back to the defaultSearchWord.
 */
function getDefaultSearchWord() {
    var filter = getInitialFilter();
    if (filter) {
        eventsOrFilterChanged();
        snackbarWithText('Successfully get default tweet filter.');
    } else {
        snackbarWithText('No default tweet filter found.');
    }
}

/**
 * @desc function which deletes the defaultSearchWord cookie
 */
function deleteDefaultSearchWord() {
    var name = "defaultSearchWord";
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    snackbarWithText('Successfully delete default tweet filter.');
}

/**
 * @desc event, if in the textFilter the "Enter"-key is pressed, a corresponding function id called which starts the
 * twiiter search
 */
$(textFilter).keypress(function (event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode === '13') {
        searchTweets();
    }
});

const domContainer = document.querySelector('#tweets');
ReactDOM.render(e(TwitterList), domContainer);
