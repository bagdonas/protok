
var net = require('net');
var protok = require('../../');


var socket = net.connect({port: 4300, host: '127.0.0.1'}, function() {

  console.log('Client connected!');

  var pt = protok.create({
    socket: socket,
    async: true,
  });

  pt.on('json', function(data) {

    if (typeof data.operation === 'undefined') {
      return;
    }

    //{"operation": "auth", "username":"foo", "password":"bar"}
    if (data.operation === 'auth') {
      if (typeof data.status !== 'undefined') {
        if (data.status == 'ok') {
          console.log('We authenticated successfully!');

          setTimeout(function() {
            write({
              operation: "message",
              body: "Test message!",
            });
          }, 5000);

          function sendGps() {
            write({
              operation: "gps",
              lat: "54.874361",
              lon: "23.999977",
            });
            setTimeout(function() {
              sendGps();
            }, 3000);
          }
          sendGps();
        }
      }
    }
    //{"operation": "message", "body": "Hello world!"}
    else if (data.operation === 'broadcast_message') {
      if (typeof data.body !== 'undefined') {
        console.log('We got message from other user:', data.body);
      }
    }



  });
  pt.run();

  function write(objToJson) {
    socket.write(JSON.stringify(objToJson) + "\r\n");
  }

  // Remove the client from the list when it leaves
  socket.on('end', function() {
    console.log('Connection closed');
  });


  write({
    operation: "auth",
    username: "foo",
    password: "bar",
  });

});
