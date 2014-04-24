
require('v8-profiler');

var net = require('net');
var protok = require('../../');
var fs = require('fs');

//console = console || {};
//console.log = function() {
//};

// Start a TCP Server
net.createServer(function(socket) {
  var authorized = false;
  var filesize = 0;
  var filename = '';
  var filepath = '';


  var pt = protok.create({
    socket: socket,
    async: true,
  });


  pt.on('json', function(data) {

    if (!authorized) {

      //{"user_id":6,"session":"183cea68670815ce63a88cd6a668ccb0"}
      if (typeof data.user === 'undefined' || typeof data.password === 'undefined') {
        write({status: "error", message: "user and password required"});
        console.log("pt.next() 1");
        pt.next();
      }
      else {
        console.log('Client is trying to login with user: ' + data.user + ', password: ' + data.password);
        if (data.user === 'foo' && data.password === 'bar') {
          authorized = true;
          write({status: "ok"});
        } else {
          write({status: "error", message: "wrong user or password"});
        }
        console.log("cr.next() 2");
        pt.next();
      }
    } else {
      //

      if (!pt.isStreaming() && typeof data.filesize !== 'undefined' && typeof data.filename !== 'undefined') {
        console.log('Starting receiving2');
        receivingFile = true;
        write({status: "ok", message: "waiting for file"});
        filesize = data.filesize;
        filename = data.filename;
        recvFile(data.filesize);
      } else {

        console.log("cr.next() 3");
        pt.next();
      }
    }

    //cr.next();

  });

//{"user":"foo", "password":"bar"}

  function recvFile() {
    path = 'tmp/';
    path += filename;

    var s = fs.createWriteStream(path);

    var rs = pt.getStream(filesize);

    rs.pipe(s);

    s.on('finish', function() {
      recvFileSuccess();
      //s.close();
      pt.next();
    });
  }

  function recvFileError() {
    write({status: "error", message: "file receive error"});
    console.log('file receive error!');
  }

  function recvFileSuccess() {
    write({status: "ok", message: "file uploaded successfully!"});
    console.log('file received successfuly:', filepath, filename, filesize);
  }

  function write(objToJson) {
    socket.write(JSON.stringify(objToJson) + "\r\n");
  }

  // Remove the client from the list when it leaves
  socket.on('end', function() {

  });

  pt.run();


}).listen(4300);



console.log("Server running\n");
//connection.end();