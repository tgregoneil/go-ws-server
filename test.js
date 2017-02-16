#!/usr/bin/node
// test.js

module.exports = function () {

// PRIVATE Properties/Methods
var _ = {

    ws: require ('go-ws-server'),
    toClient: null,
    key1: require ('go-util').key1

}; // end PRIVATE properties
//---------------------
_.init = () => {
    
    var options = {verbose: true,
        isSecure: false};

    var port = 8000;
    _.ws = new _.ws (port, _.action, options);

    _.toClient = _.ws.toClient;

    return;

}; // end _.init

//---------------------
_.action = (wsId, msgOb) => {
    console.log ('====]>  test.js._.action.msgOb: ' + JSON.stringify (msgOb));
    console.log ('    wsId: ' + wsId);
    
    var cmd = _.key1(msgOb);
    switch (cmd) {

        case 'initConnection':

            var ready = {ready:1};
            _.toClient (wsId, ready);
            break;

        case 'tstCmd':

            _.toClient (wsId, {srvMsg: 'hello, client'});

            break;

    } // end switch (cmd)


}; // end _.action 

_.init ();

}();



