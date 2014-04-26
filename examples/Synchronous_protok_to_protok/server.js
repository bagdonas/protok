
var net = require('net');
var path = require('path');
var fs = require('fs');
var protok = require('../../');


var sockets = [];

// Start a TCP Server
net.createServer(function(socket) {

  sockets.push(socket);
  var authenticated = false;

  function write(objToJson, cb) {
    socket.write(JSON.stringify(objToJson) + "\r\n", 'utf8', cb);
  }

  function sendFile(file) {
    console.log('Sending file');
    var stats = fs.statSync(file);
    var filesize = stats["size"];
    var filename = path.basename(file);
    write({operation: "file", filename: filename, filesize: filesize}, function() {
      var rs = fs.createReadStream(file, {end: filesize});
      rs.on('end', function(d) {
        console.log('Sending completed');
        pt.next();
      });
      rs.pipe(socket, {end: false});

    });
  }

  function recvFile(filename, filesize) {
    var ws = fs.createWriteStream('tmp/' + filename);
    ws.on('finish', function() {
      ws.end();
      success();
    });
    ws.on('error', function(err) {
      rs.read();
      error();
    });

    var rs = pt.getStream(filesize);
    rs.pipe(ws);

    function error() {
      write({operation: "file",
        status: "error",
        message: "file receive error"
      });
      console.log('file receive error!');
      pt.next();
    }

    function success() {
      write({
        operation: "file",
        status: "ok",
        message: "file uploaded successfully!"
      });
      console.log('file received successfuly!');
      pt.next();
    }
  }


  // Remove the client from the list when it leaves
  socket.on('end', function() {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  socket.on('error', function() {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  // Protok
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
          console.log('Client auth ok');
          write({
            operation: 'auth',
            status: "ok"
          });
        } else {
          console.log('Client auth error');
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
      //{"operation": "message", "body": "Hello world!"}
      else if (data.operation === 'file') {
        if (!pt.isStreaming() && typeof data.filesize !== 'undefined' && typeof data.filename !== 'undefined') {
          console.log('Starting receiving file ', data.filename, data.filesize);
          return recvFile(data.filename, data.filesize);
        } else {
          console.log("cr.next() 3");
          pt.next();
        }
      }

    }
    pt.next();
  });

  pt.on('stream_error', function() {
    console.log('File transfer error!');
  });

  pt.run();

  pt.interrupt(function() {
    sendFile('/ebs3/photos2/Paskutines/ss1/20130215_223541.mp4');
    //sendFile('../test_files/1.jpg');
  });
  // Protok

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