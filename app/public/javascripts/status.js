// jshint node: true
// jshint browser: true
// jshint jquery: true
// jshint esversion: 6
"use strict";

const e = React.createElement;
let setStatus = () => {
};
let addRequest = () => {
};

let showStatus = () => {
    $('#status')[0].style.visibility = 'visible';
};

let hideStatus = () => {
    $('#status')[0].style.visibility = 'hidden';
};

$(function () {
    $("#status").draggable({containment: "document"});
});

class Status extends React.Component {
    constructor(props) {
        super(props);
        this.state = {streamConnected: true, lastTweet: null, lastWeather: null, lastWeatherUpdate: null, lastTweetDisplayed: null, lastUpdates: [], lastRequests: []};
        setStatus = this.setStatus.bind(this);
        addRequest = this.addRequest.bind(this);
    }

    setStatus(state, value) {
        const self = this;
        if (state === "lastUpdates") {
            const updates = self.state.lastUpdates;
            if (updates.length === 10) {
                updates.pop();
            }
            updates.unshift(value.id + ": " +value.message);
            this.setState({lastUpdates: updates});
        } else {
            this.setState({[state]: value});
        }
    };

    addRequest(request) {
        const requests = this.state.lastRequests;
        for (var i in requests) {
            if (requests[i].id === request.id) {
                requests.splice(i, 1);
            }
        }
        if (requests.length === 5) {
            requests.pop();
        }
        requests.unshift(request);
        this.setState({lastRequests: requests});
    };

    render() {
        const self = this;
        const {
            Card,
            CardContent,
            CardHeader,
            IconButton,
        } = window['MaterialUI'];


        const header = e(CardHeader, {
            title: "Status Informations",
            action: e(IconButton, {
                onClick: () => hideStatus(),
                style: {color: "black"}
            }, e("i", {className: "fas fa-times", color: "black", style: {"fontSize": "1.8em"}}))
        });

        const tableRows = [];
        const headerRow = e("thead", {key:"head"}, e("tr", null, e("th", null, "Request Id"), e("th", null, "Send"), e("th", null, "Status")));
        tableRows.push(headerRow);

        self.state.lastRequests.map(function (item, i) {
            const row = e("tbody", {key:i}, e("tr", null, e("td", null, item.id), e("td", null, item.send), e("td", null, item.status)));
            tableRows.push(row);
        });

        const updates = [];

        self.state.lastUpdates.map((item, i) => {
            updates.push(item);
            updates.push(e("br", {key:i}));
        });

        const table = e("table", {className: "striped bordered hover"}, tableRows);
        const content = e(CardContent, null, e("p", null, "Last weather update: " + self.state.lastWeatherUpdate), e("p", null, "Last weather change: " + self.state.lastWeather), e("p", null, "Twitter-Stream connected: " + self.state.streamConnected), e("p", null, "Last Tweet received: " + self.state.lastTweet), table, e("br"), e("h4", null, "Last Status recived from API"), updates);

        return e(Card, null, header, content);
    }


}


const domContainer2 = document.querySelector('#status');
ReactDOM.render(e(Status), domContainer2);
