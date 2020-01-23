const e = React.createElement;
let setStatus= ()=>{};
let addRequest= () =>{};

showStatus= () => {
       $('#status')[0].style.visibility = 'visible'
}

hideStatus= () =>  {
    $('#status')[0].style.visibility = 'hidden'
}

$( function() {
    $( "#status" ).draggable(  {containment: "document"});
  } )

  class Status extends React.Component {
    constructor(props) {
        super(props);
        this.state = {lastTweet: null, lastWeather: null, lastTweetDisplayed: null, lastUpdates: [], lastRequests: []};
        setStatus = this.setStatus;
        addRequest = this.addRequest;
    }

    setStatus = (state, value) =>{
        const self=this;
        if(state == "lastUpdates"){
            const updates = self.state.lastUpdates;
            if(updates.length == 10){
                updates.pop()
            }
            updates.unshift(value)
            this.setState({lastUpdates: updates})
        }
        else{
        this.setState({[state] : value})
        }
    }


    addRequest= (request) =>{
        console.log(request)
        const requests = this.state.lastRequests;
        for(var i in requests){
            if (requests[i].id === request.id){
                requests.splice(i, 1)
            }
        }
        if(requests.length== 5){
            requests.pop();
        }
        requests.unshift(request);
        console.log(requests)
        this.setState({lastRequests : requests})
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


            const header= e(CardHeader, {title: "Status Informations",
                                        action: e(IconButton, {onClick: ()=> hideStatus()}, e("i", {className: "fas fa-times icon", "aria-hidden":"true"}))})

            const tableRows = [];
            const headerRow = e("thead", null, e("tr", null, e("th",null , "Request Id"), e("th",null , "Send"), e("th",null , "Status")))
            tableRows.push(headerRow)

            self.state.lastRequests.map(function(item, i){
                const row= e("tbody", null ,e("tr", null, e("td",null , item.id), e("td",null , item.send), e("td",null , item.status)))
                tableRows.push(row)
            })

            const updates = [];

            self.state.lastUpdates.map((item, i) =>{
                 updates.push(item)
                updates.push(e("br"))
            })
            
            const table = e("table", {className : "striped bordered hover"}, tableRows)
            return e(Card, null, header, e("p", null, "Last Tweet Recived: " +self.state.lastTweet), e("p", null, "Last Weather Update: " +self.state.lastWeather), table, e("br"), e("h4", null, "Last Status recived from API"), updates)
        }


    }


const domContainer2 = document.querySelector('#status');
ReactDOM.render(e(Status), domContainer2);
