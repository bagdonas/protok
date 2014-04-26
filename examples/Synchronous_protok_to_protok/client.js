
var net = require('net');
var path = require('path');
var fs = require('fs');
var protok = require('../../');


var socket = net.connect({port: 4300, host: '127.0.0.1'}, function() {

  console.log('Client connected!');

  function write(objToJson, cb) {
    socket.write(JSON.stringify(objToJson) + "\r\n", 'utf8', cb);
  }

  function sendFile(file) {
    var stats = fs.statSync(file);
    var filesize = stats["size"];
    var filename = path.basename(file);

    write({operation: "file", filename: filename, filesize: filesize}, function() {
      console.log('piping file');
      var rs = fs.createReadStream(file, {end: filesize});
      rs.on('end', function(d) {
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

  socket.on('end', function() {
    console.log('Connection closed');
  });

  // Protok
  var pt = protok.create({
    socket: socket,
    async: false,
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
          return sendFile('../test_files/2.jpg');
        }
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

    pt.next();
  });

  pt.on('stream_error', function() {
    console.log('File transfer error!');
  });
  pt.run();

  pt.interrupt(function() {
    write({
      operation: "auth",
      username: "foo",
      password: "bar",
    });
    pt.next();
  });
  // Protok

});

