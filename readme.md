### Websocket Server

Companion to go-ws-client

*** NOTE: Instructions from go-ws-client/readme.md test case are repeated here ***

### Installation
Install browserify globally, then install client.

```shell
$ npm install -g browserify
$ npm install go-ws-client
```

### Run Test Case

##### 1. Create html file (wsClientTst.html)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <script src="./wsClientBfied.js"></script>
</head>
<body>
</body>
</html>
```

##### 2. Create javascript driver (wsClientTst.js)

```js
module.exports = (function () {

    var ws = require ('go-ws-client');
    var key1 = require ('go-util').key1;

    var wsClient = new ws ('localhost', 8000, (msgOb) => {

        console.log ('msgOb: ' + JSON.stringify (msgOb) + '\n');
        
        var cmd = key1 (msgOb);
        var msg = msgOb [cmd];
    
        switch (cmd) {
    
            case 'ready':
    
                wsClient.toSrvr ({tstCmd:1});
                break;
    
            case 'srvMsg':
    
                document.write (msg)
                break;
    
        } // end switch (cmd)

    }, {verbose: true});

}());

```

##### 3. Browserify driver, including required dependencies (doBrowserify.sh)

```shell
$ browserify wsClientTst.js -o wsClientBfied.js
```

##### 4. Install server

```shell
$ npm install go-ws-server
```
##### 5. Start server

```shell
go-ws-server/test.js
```

##### 6. Point browser to wsClientTst.html

##### 7. Observe msg, "hello, client" in browser

tada!

