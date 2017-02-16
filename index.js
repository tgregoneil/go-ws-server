// go-ws-server/index.js

module.exports = function (port, agent, options) {

// PRIVATE Properties/Methods
var _ = {

    port: port,
    agent: agent ? agent : null,
    verbose: null,
    isSecure: null,

    fs: require ('fs'),
    https: require ('https'),
    ut: require ('go-util'),
    key1: null,
    pcheck: null,
    WebSocketServer: require('ws').Server,
    express: require ('express'),

    wsConnects: [],
    waitConnectionCount: 0,

}; // end PRIVATE properties

//---------------------
_.init = () => {

    _.key1 = _.ut.key1;
    _.pcheck = _.ut.pCheck;

    var o = _.pcheck (options, {
        verbose: false,
        isSecure: false,
        privateKeyFile: "",
        certificateFile: ""
    });

    _.verbose = o.verbose;
    _.isSecure = o.isSecure;

    if (!port) {

        console.log ('wsServer: port not defined');
        process.exit ();

    } // end if (!port)


    if (_.isSecure) {

        var privateKey = _.fs.readFileSync(privateKeyFile, 'utf8');
        var certificate = _.fs.readFileSync(certificateFile, 'utf8');
    
        var credentials = {key: privateKey, cert: certificate};
        var app = _.express();
        
        var httpsServer = _.https.createServer(credentials, app);
        httpsServer.listen(port);
        var wss = new _.WebSocketServer ({server: httpsServer});

    } else {

        var wss = new _.WebSocketServer ({port: port});

    } // end if (_.isSecure)
    
    wss.on('connection', _.initConnection); 

}; // end _.init


//---------------------
_.doSend = (wsConnect, msg) => {
    if (_.verbose) {

        console.log ('wsServer._.doSend.msg: ' + msg + '\n');

    } // end if (_.verbose)
    
    
    var ws = wsConnect.ws;

    // Wait until the state of the socket is not ready and send the message when it is...
    // per SO:  http://stackoverflow.com/questions/13546424/how-to-wait-for-a-websockets-readystate-to-change
    _.waitConnectionCount = 0;
    _.waitSocketConnection(ws, function(){
        if (_.verbose) {

            console.log("message sent -- waitConnectionCount: " + _.waitConnectionCount);

        } // end if (_.verbose)
        
        ws.send(msg);
    });

}; // end _.doSend 



//---------------------
_.initConnection = (ws) => {
    
    console.log ('wsServer._.initConnection  new connection wsId: ' + _.wsConnects.length);

    var wsConnect = {ws:ws, agent:_.agent, wsId: _.wsConnects.length};

    _.wsConnects.push (wsConnect);

    //---------------------
    var fromClient = (msg) => {
        if (_.verbose) {

            console.log ('fromClient.msg: ' + msg);

        } // end if (_.verbose)
        
    
        _.inOb (wsConnect, JSON.parse (msg).m);
    
        return false;
    
    }; // end _.fromClient 
    

    ws.on('message', fromClient);

    ws.on ('close', function () {console.log ('client closed ' + wsConnect.wsId);});

    wsConnect.agent (wsConnect.wsId, {initConnection:1});

}; // end _.initConnection 

//---------------------
_.inOb = (wsConnect, ob) => {

    var wsId = wsConnect.wsId;

    if (_.verbose) {
        
        console.log ('wsServer._.inOb.ob: ' + JSON.stringify (ob));
        console.log ('wsServer.inOb.wsId : ' + wsId );

    } // end if (_.verbose)
    
    wsConnect.agent (wsId, ob);

}; // end _.inOb 


//---------------------
_.waitSocketConnection = (socket, callback) => {
    
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                if (_.verbose) {

                    console.log("Connection is made")

                } // end if (_.verbose)
                
                if(callback != null){
                    callback();
                }
                return;

            } else {
                if (_.verbose) {

                    console.log("wait for connection... waitConnectionCount " + _.waitConnectionCount++)

                } // end if (_.verbose)
                
                if (_.waitConnectionCount < 8) {
                    
                    _.waitSocketConnection(socket, callback);

                } // end if (_.waitConnectionCount < 8)
                
            }

        }, 5); // wait 5 milisecond for the connection...

}; // end _.waitSocketConnection 


// PUBLIC Properties/Methods
var P = {};

//---------------------
P.toClient = (wsId, msgOb) => {
        
    var wsConnect = _.wsConnects [wsId];
    if (_.verbose) {
        
        var toClient = JSON.stringify (msgOb);
        var maxPrt = 1000;

        var msgL = toClient.length;
        if (msgL > maxPrt) {

            var maxPrtHalf = maxPrt / 2;
            var firstHalf = toClient.substr (0, maxPrtHalf - 1);
            var secondHalf = toClient.substr (msgL - maxPrtHalf, msgL - 1);

            toClient = firstHalf + '   ...   ' + secondHalf;

        } // end if (toClient.length > maxPrt)
        
        toClient += '  wsId: ' + wsId;
        if (_.verbose) {

            console.log ('wsServer.P.toClient.msgOb: ' + toClient + '\n');

        } // end if (_.verbose)
        

    } // end if (_.verbose)
    
    var msgObWrap = {m: msgOb};
    var msgObWrapS = JSON.stringify (msgObWrap);

    _.doSend (wsConnect, msgObWrapS);
    
    return;

}; // end P.toClient 

// end PUBLIC section

_.init();
return P;

};


