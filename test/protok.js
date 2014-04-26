var net = require('net');
var crypto = require('crypto');
var fs = require('fs');
var debug = require('debug')('test:protok');
var should = require('chai').should();
var protok = require('../lib/protok');

describe('Synchronous test', function() {

  this.timeout(10000);

  it('should send requests and files to server and process them appropriately', function(done) {

    var connected = false;
    var pt = null;

    var clientCmds = [];
    var serverCmds = [];
    var clientFileHashes = [];
    var serverFileHashes = [];

    function server(cb) {
      var server = net.createServer(function(socket) {
        function write(objToJson, cb) {
          socket.write(JSON.stringify(objToJson) + "\r\n", 'utf8', cb);
        }

        function recvFile(filename, filesize) {
          var rs = pt.getStream(filesize);
          var digest = crypto.createHash("sha1");
          rs.on('data', function(data) {
            digest.update(data);
          });

          rs.on('end', function() {
            serverFileHashes.push(digest.digest("hex"));
            pt.next();
          });
        }

        // Remove the client from the list when it leaves
        socket.on('end', function() {

        });
        socket.on('error', function() {

        });
        // Protok
        pt = protok.create({
          socket: socket,
          async: false,
        });
        pt.on('json', function(data) {
          serverCmds.push(data);
          debug('Request got: ' + data);
          if (data.operation === 'test') {
            if (typeof data.value !== 'undefined') {
              debug("'test' request got");
            }
          } else
          if (data.operation === 'file') {
            if (!pt.isStreaming() && typeof data.filesize !== 'undefined' && typeof data.filename !== 'undefined') {
              debug('Starting receiving file ' + data.filename + ' ' + data.filesize);
              return recvFile(data.filename, data.filesize);
            } else {
              pt.next();
            }
          } else if (data.operation === 'finish') {
            debug('"finish" request got');
            finish();
          }

          pt.next();
        });
        pt.on('stream_error', function() {
          debug('File transfer error');
        });
        pt.run();
        pt.interrupt(function() {
          write({operation: "test"});
          pt.next();
        });

        setTimeout(function() {
          pt.interrupt(function() {
            setTimeout(function() {
              write({operation: "test"});
              pt.next();
            }, 1000);
          });
        }, 200);

        // Protok

      }).listen(4300);
      server.on('listening', function() {
        cb();
      });
    }

    function client() {
      var socket = net.connect({port: 4300, host: '127.0.0.1'}, function() {
        connected = true;
        debug('Client connected!');
        function write(objToJson, cb) {
          clientCmds.push(objToJson);
          socket.write(JSON.stringify(objToJson) + "\r\n", 'utf8', cb);
        }

        function sendFile(filesize, cb) {

          write({operation: "file", filename: "test.bin", filesize: filesize}, function() {
            var digest = crypto.createHash("sha1");
            var sent = 0;
            var stop = Math.floor(filesize / 4);

            if (filesize < 0)
              filesize = 0;

            function sendData() {
              var datasize = Math.floor(Math.random() * (65536 - 4096) + 4096);

              if (datasize > filesize - sent)
                datasize = filesize - sent;
              var data = crypto.randomBytes(datasize);
              digest.update(data);

              socket.write(data, function() {
                sent += datasize;
                if (sent < filesize) {
                  process.nextTick(function() {

                    if (sent >= stop) {
                      stop *= 2;
                      setTimeout(function() {
                        sendData();
                      }, 200);
                    } else {
                      sendData();
                    }
                  }, 0);
                } else {
                  clientFileHashes.push(digest.digest("hex"));
                  cb();
                }
              });
            }
            sendData();
          });
        }

        socket.on('end', function() {
          debug('Connection closed');
        });

        write({operation: "test", value: "value1"}, function() {
          sendFile(1000000, function() {
            write({operation: "test", value: "value1"}, function() {
              sendFile(0, function() {
                sendFile(-1, function() {
                  sendFile(1, function() {
                    sendFile(10, function() {
                      sendFile(1000000, function() {
                        finishCb = done;
                        write({operation: "finish"}, function() {
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    }

    function finish() {
      serverCmds.should.be.eql(clientCmds);
      serverFileHashes.should.be.eql(clientFileHashes);
      done();
    }

    server(function() {
      client();
    });
  });

});