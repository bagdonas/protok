#Protok.js

A node.js module to easily make all kinds of protocols.

##Features


For mobile application
Server to server communication
File transfering

Synchronous and asynchronous modes

Flexible

Utilizes node.js streams

Control mechanizms to prevent server overloading

Abuse prevention



Protok.js splits all incoming traffic by separator string(default is '\r\n')


Protok.js has two operation modes:
- Synchronous
- Asynchronous


## Synchronous
In synchronous mode every data thunk is processed sequently one after another every time blocking the flow.
Synchronous is useful when sequence and consistency matters. For example if we are writing some file management protocol like FTP, and let's imagine we want to send two commands: "mkdir test", "rmdir test". For this case it's very important for the protocol to be synchronous besause otherwise if both commands would be executed at the same time, you can't be sure if the directory was firstly created and secondly deleted or it was deleted(unexisted) and then created.
Generally in synhronic communication, the server should send respnce after each request, and client send another request only after receives responce. And the downside is that every time when the cycle is repeating, latency of the connection is slowing every command. It depends on the case, but sometimes we can send more commands in the row expecting that everything will be ok. Of course tracking of the responces will be harder because if we send three commands in the row, we are going to receive them in the row too. But it's good that in synchronous protocl all of them will be in the some order as requests.
Another use case for asynchronous protocol would be

Protok.js buffers requests

It's quite simple, and fits for many use cases


## Asynchronous
Real time
In asynchronous mode every thunk of data is parsed and processed as soon as data is received. Though there are some flow stoping mechanisms to limit how many requested could be active depending on server load.

Nowdays if it's possible the asynchronous protocol should be used. every request and responce is independed of each other.

For example for mobile application when communicating in real time sending gps coorinates, updating information..





##Instalation of module
For this module no additional dependencies are required.
Via [npm](http://www.npmjs.org/):

    npm install protok
    
Or clone repo:

    npm install git://github.com/bagdonas/protok.git

##Getting Started
Protok.js operates on socket object, thus we need to provide it.

```js
var protok = require('protok');

var pt = protok.create({
    socket: socket,
  });

  pt.on('json', function(data) {
  
  }
  
  pt.run();
```


Protok.js is suitable for using on server and client side.


Server side
```js

```


Protok can output requests in one of the two formats:

parsed JSON object
```js
  //if we will send f.e. '{"operation":"message","body":"test"}\r\n'
  pt.on('json', function(data) {
    // data is parsed json object, so
    // we will get data.operation='message' and data.body='test'
  }
```

or raw data
```js
  //if we will send f.e 'my_data\r\n'
  pt.on('line', function(data) {
    // data is raw line delimited by \r\n (by default), wo
    // we will receive data='my_data'
  }
```



## How synchronous mode work
Synchronous mode is enabled by setting 'async: false' option in protok.create function. In synchronous mode only one 'json' or 'line' event should be emited at the time. 'pt.next()' is the trigger for parsing and emitting another request. It's very important to have one and only one 'pt.next()' call from request event function. It's good to use one 'pt.next()' at the end of request event function for synchronous code, and others put as the last call of all asynchronous code. First one will be called only if all the code in event function is synchronous.

```js
var protok = require('protok');

var pt = protok.create({
    socket: socket,
    async: false,
  });

  pt.on('json', function(data) {
    if(data.operation==='test1') {
        someSyncFunc(); 
    }
    else if(data.operation==='test2'){
        // if we have asynchronous code, we should return it
        // to prevent additional call at the end of event function
        return someAsynFunc(function() {
            pt.next(); // call 'pt.next()' when asynchronous code will be finished
        });
    }
    pt.next(); // this should be called only if all the code above is synchronous
  }
  
  pt.run();
```

## How asynchronous mode work
Asynchronous mode in asynchronous javascript world is easier to use and grasp. Just imagine we send many blocks of information to the server and protok parses it and emits request events instantly. There could be dozens of request events emited at the same from the same socket connection. In asynhronous mode everything work more like data packets. Every packet is independed of each other. For this type of protocols some routing information in data packet is needed.

```js
var protok = require('protok');

var pt = protok.create({
    socket: socket,
    async: true,
  });

  pt.on('json', function(data) {
    if(data.operation==='test1') {
        someSyncFunc(); 
    }
    else if(data.operation==='test2'){
        someAsynFunc(function() {
        });
    }
  }
  
  pt.run();
```










