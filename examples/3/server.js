
var net = require('net');
var protok = require('../../');


var sockets = [];

// Start a TCP Server
net.createServer(function(socket) {

  sockets.push(socket);

  var authenticated = false;

  var pt = protok.create({
    socket: socket,
    async: false,
  });

  pt.on('json', function(data) {
    if (typeof data.operation === 'undefined') {
      write({
        status: "error",
        message: "Operation name is required!"
      });
      return;
    }

    if (!authenticated) {

      //{"operation": "auth", "username":"foo", "password":"bar"}
      if (data.operation === 'auth') {

        if (typeof data.username !== 'undefined' || typeof data.password !== 'undefined'
                && data.username === 'foo' && data.password === 'bar') {
          authenticated = true;
          write({
            operation: 'auth',
            status: "ok"
          });
        } else {
          write({
            operation: 'auth',
            status: "error",
            message: "Correct 'username' and 'password' is required!"
          });
        }
      }
    } else {

      //{"operation": "gps", "lat":"54.874361", "lon":"23.999977"}
      if (data.operation === 'gps') {
        if (typeof data.lat !== 'undefined' || typeof data.lon !== 'undefined') {
          console.log('GPS coordinates received:', data.lat, data.lon);
          //it's not worth of the traffic to send confirmation of got coordinates, 
          //because it's a constantly repetitive task
        } else {
          //only when error occurs
          write({
            operation: 'gps',
            status: "error",
            message: "'lat' and 'lon' is required!"
          });
        }
      }
      //{"operation": "message", "body": "Hello world!"}
      else if (data.operation === 'message') {
        if (typeof data.body !== 'undefined') {
          console.log('Message got! Broadcasting it!:', data.body);
          broadcast({operation: 'broadcast_message', body: data.body}, socket);
        } else {
          write({
            operation: 'message',
            status: "error",
            message: "Message 'body' is required!"
          });
        }
      }

    }

  });

  //{"user":"foo", "password":"bar"}

  function write(objToJson) {
    socket.write(JSON.stringify(objToJson) + "\r\n");
  }

  // Remove the client from the list when it leaves
  socket.on('end', function() {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  pt.run();

}).listen(4300);


// Send a message to all clients
function broadcast(objToJson, sender) {
  sockets.forEach(function(socket) {
    // Don't want to send it to sender
    if (socket === sender)
      return;
    socket.write(JSON.stringify(objToJson) + "\r\n");
  });
}


console.log("Server running\n");
//connection.end();