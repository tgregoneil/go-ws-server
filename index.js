// go-ws-server/index.js

module.exports = function (port, agent, options) {

// PRIVATE Properties/Methods
var v = {

    port: port,
    agent: agent ? agent : null,
    isSecure: null,

    ut: require ('go-util'),
    minsec: require ('minsec').getMinSec,
    msgShorten0: require ('msgshorten'),
    msgSh: null,

    key1: null,
    pcheck: null,

    //WebSocketServer: require('ws').Server,
    ws0: require('ws'),

    wsConnects: [],
    waitConnectionCount: 0,

    broadcastMode: false,
    broadcastExclude: {},
    wsPrimary: -1,
    broadcastCmds: null,
    l0CmdOn: null,
    l0CmdOff: null,

        // for secure connection
    fs: require ('fs'),
    express: require ('express'),
    https: require ('https'),

}; // end PRIVATE properties
var f={};

//---------------------
f.init = () => {

    v.key1 = v.ut.key1;
    v.pcheck = v.ut.pCheck;

    v.broadcastExclude = {
        setUsername: 1,
        settingsGet: 1,
        pageInit: 1,
    };

    //var targetLength = 80800;
    var targetLength = 200;
    v.msgSh = new v.msgShorten0 (targetLength);
//v.msgSh.setKeysOnly (true);


    var o = v.pcheck (options, {
        isSecure: false,
        privateKeyFile: "",
        certificateFile: ""
    });

    v.isSecure = o.isSecure;

    if (!port) {

        console.log ('wsServer: port not defined');
        process.exit ();

    } // end if (!port)


    if (v.isSecure) {

        var privateKey = v.fs.readFileSync(o.privateKeyFile, 'utf8');
        var certificate = v.fs.readFileSync(o.certificateFile, 'utf8');
    
        var credentials = {key: privateKey, cert: certificate};
        var app = v.express();
        
        var httpsServer = v.https.createServer(credentials, app);
        httpsServer.listen(port);

        //var wss = new v.WebSocketServer ({server: httpsServer});
        var wss = new v.ws0.Server ({server: httpsServer});

    } else {

        //var wss = new v.WebSocketServer ({port: port});
        var wss = new v.ws0.Server ({port: port});

    } // end if (v.isSecure)
    
    v.l0CmdOn = JSON.stringify ({l0: 1});
    v.l0CmdOff = JSON.stringify ({l0: 0});

    wss.on('connection', f.initConnection); 

}; // end f.init


//---------------------
f.doSend = (wsId, msgObS) => {

        //console.log ('wsServer.f.doSend.msg: ' + msg + '\n');
    
    var time = v.minsec ();

    var msg = v.msgSh.msgShorten (msgObS);
    console.log ('<[==== ' + wsId + ' ' + time + ' wsServer.toClient: ' + msg + '\n');
    var wsConnect = v.wsConnects [wsId];
    
    var ws = wsConnect.ws;

    // Wait until the state of the socket is not ready and send the message when it is...
    // per SO:  http://stackoverflow.com/questions/13546424/how-to-wait-for-a-websockets-readystate-to-change
    v.waitConnectionCount = 0;
    f.waitSocketConnection(ws, function(){

            //console.log("message sent -- waitConnectionCount: " + v.waitConnectionCount);

        if (ws.readyState) {

            ws.send(msgObS);

        } else {

            var wsId = wsConnect.wsId;
            console.log ('client exit wsId: ' + wsId);

        } // end if (ws.readyState)
        
    });

}; // end f.doSend 



//---------------------
f.initConnection = (ws, req) => {
    console.log ('wsServer.f.initConnection  new connection wsId: ' + v.wsConnects.length);
    console.log ('req.connection.remoteAddress: ' + req.connection.remoteAddress);

    //---------------------
    var fromClient = (msg) => {

            //console.log ('fromClient.msg: ' + msg);
    
        f.inOb (wsConnect, JSON.parse (msg));
    
        return false;
    
    }; // end v.fromClient 
    


       // ---- main ----
    v.serverIp = ws.protocol;
    console.log ('Server ip: ' + v.serverIp);

    var wsConnect = {ws:ws, agent:v.agent, wsId: v.wsConnects.length};

    var wsId = wsConnect.wsId;

    v.wsConnects.push (wsConnect);

    ws.on('message', fromClient);

    ws.on ('close', function () {

        if (v.broadcastMode && wsId === v.wsPrimary) {

            P.broadcastDisable ();

        } // end if (v.broadcastMode && wsId === v.wsPrimary)
        
        console.log ('client closed ' + wsId);
    });

    var ip = req.connection.remoteAddress.replace (/.*:/, "");

    wsConnect.agent (wsId, {initConnection: ip});

}; // end f.initConnection 

//---------------------
f.inOb = (wsConnect, ob) => {

        var time = v.minsec ();
        var wsId = wsConnect.wsId;

        var obShort = v.msgSh.msgShorten (ob);
        console.log ('\n\n====]> ' + wsId + ' ' + time + ' wsServer.js.inOb.msgOb: ' + obShort);

    var wsId = wsConnect.wsId;

        //console.log ('wsServer.f.inOb.ob: ' + JSON.stringify (ob));
        //console.log ('wsServer.inOb.wsId : ' + wsId );
    
    wsConnect.agent (wsId, ob);

}; // end f.inOb 


//---------------------
f.waitSocketConnection = (socket, callback) => {
    
    setTimeout(
        function () {
            if (socket.readyState === 1) {

                    //console.log("Connection is made")
                
                if(callback != null){
                    callback();
                }
                return;

            } else {

                    //console.log("wait for connection... waitConnectionCount " + v.waitConnectionCount++)
                
                if (v.waitConnectionCount < 8) {
                    
                    f.waitSocketConnection(socket, callback);

                } // end if (v.waitConnectionCount < 8)
                
            }

        }, 5); // wait 5 milisecond for the connection...

}; // end f.waitSocketConnection 


// PUBLIC Properties/Methods
var P = {};

//---------------------
P.broadcastDisable = () => {
    
    for (var wsId = 0; wsId < v.wsConnects.length; wsId++) {

        if (wsId !== v.wsPrimary) {

            f.doSend (wsId, v.l0CmdOff);

        } // end if (wsId !== wsPrimary)

    } // end for (var wsId = 0; wsId < wsConnects.length; wsId++)

    v.broadcastMode = false;
    v.wsPrimary = -1;

    v.broadcastCmds = null;

}; // end P.broadcastDisable


//---------------------
P.broadcastEnable = (wsPrimary) => {
    
    v.broadcastMode = true;
    v.wsPrimary = wsPrimary;

    v.broadcastCmds = [];
    
    for (var wsId = 0; wsId < v.wsConnects.length; wsId++) {

        if (wsId !== wsPrimary) {

            f.doSend (wsId, v.l0CmdOn);

        } // end if (wsId !== wsPrimary)

    } // end for (var wsId = 0; wsId < wsConnects.length; wsId++)


}; // end P.broadcastEnable 


//---------------------
P.getServerIp = () => {
    
    return v.serverIp;

}; // end P.getServerIp


//---------------------
P.getWsPrimary = () => {
    
    return v.wsPrimary;

}; // end P.getWsPrimary

//---------------------
P.isBroadcastEnabled = () => {
    
    return v.wsPrimary !== -1;

}; // end P.isBroadcastEnabled


//---------------------
P.toClient = (wsId, msgOb) => {

    var doBroadcast;
    if (msgOb.hasOwnProperty ('doBroadcast')) {

        doBroadcast = msgOb.doBroadcast;
        delete msgOb.doBroadcast;

    } else {

        doBroadcast = v.broadcastMode;

    } // end if (msgOb.hasOwnProperty ('doBroadcast'))

    var sendBroadcastCmds = false;
    if (msgOb.hasOwnProperty ('sendBroadcastCmds')) {

        sendBroadcastCmds = msgOb.sendBroadcastCmds;
        delete msgOb.sendBroadcastCmds;

    } // end if (msgOb.hasOwnProperty ('sendBroadcastCmds'))
    

    if (!msgOb) {

        console.log ('go-ws-server.toClient: !msgOb');
        return;

    } // end if (!msgOb)
    
    var time = v.minsec ();

    doBroadcast = doBroadcast && v.wsPrimary === wsId;

    var msgObA = Array.isArray (msgOb) ? msgOb : [msgOb];

    var msgMain;
    msgObA.forEach (function (msg) {

        msgMain = v.key1 (msg);
        doBroadcast = doBroadcast && !v.broadcastExclude [msgMain];
        if (msgMain === 'initG' && msg.initG.name === 'users') {

            doBroadcast = false;

        } // end if (msgMain === 'initG' && msgObA[0].name === 'users')

        var msgContent = msg [msgMain];

        if (msgContent.hasOwnProperty ('idGCur') && msgContent.idGCur.match (/Start/)) {

            doBroadcast = false;

        } // end if (msgContent.idGCur.match (/Start/))
        
    });

    var msgObS = JSON.stringify (msgOb);

    if (msgMain !== 'kyb' && msgMain !== 'st') {
        // kyb and st are only sent from user 'rrr', and therefore do not need to be sent back to 'rrr'

         f.doSend (wsId, msgObS);

         /* causes a delay returning command to give time to test if key/click interaction in client is disabled
        setTimeout (function () {
            
            f.doSend (wsId, msgObS);

        }, 3000);
         */

    } // end if (msgMain !== 'kyb')
    
    if (doBroadcast) {

        v.broadcastCmds.push (msgObS);

        var wsConnectsLength = v.wsConnects.length
        for (let wsIdb = 0; wsIdb < wsConnectsLength; wsIdb++) {

            if (wsIdb !== wsId) {

                f.doSend (wsIdb, msgObS);

            } // end if (wsIdb !== wsId)

        } // end for (var i = 0; i < wsConnectsLength; i++)
        
    } else if (sendBroadcastCmds) {
        
        f.doSend (wsId, v.l0CmdOn);
        v.broadcastCmds.forEach (function (cmdObS) {

            f.doSend (wsId, cmdObS);
        });

    } // end if (doBroadcast)
    
    
    return;

}; // end P.toClient 

// end PUBLIC section

f.init();
return P;

};


