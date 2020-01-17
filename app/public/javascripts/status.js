const e = React.createElement;
let setStatus= ()=>{};

showStatus= () => {
       $('#status')[0].style.visibility = "visible"
}

$( function() {
    $( "#status" ).draggable();
  } )

  class Status extends React.Component {
    constructor(props) {
        super(props);
        this.state = {lastTweet: null, lastWeather: null, lastTweetDisplayed: null, lastStatusUpdates: []};
        setStatus = this.setStatus
    }

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

            return e(Card, null, e("p", null, "Test"))
        }


    }


const domContainer2 = document.querySelector('#status');
ReactDOM.render(e(Status), domContainer2);
