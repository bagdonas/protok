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

Parsed JSON object
```js
  //if we will send f.e. '{"operation":"message","body":"test"}\r\n'
  pt.on('json', function(data) {
    // data is parsed json object, so
    // we will get data.operation='message' and data.body='test'
  }
```

Or RAW data
```js
  //if we will send f.e 'my_data\r\n'
  pt.on('line', function(data) {
    // data is raw line delimited by \r\n (by default), wo
    // we will receive data='my_data'
  }
```
















