
var net = require('net');
var exec = require('child_process').exec;
var protok = require('../../');


// Start a TCP Server
net.createServer(function(socket) {

  var authenticated = false;

  var pt = protok.create({
    socket: socket,
    async: false,
  });

  pt.on('line', function(data) {

    if (!authenticated) {

      if (data == 'foo:bar') {
        authenticated = true;
        write('Authentication ok');
      } else {
        write('Authentication error');
      }
    } else {
      if (data == 'ls') {
        return exec('ls -la', function callback(error, stdout, stderr) {
          write(stdout.replace(/\n/g, "\r\n"));
          pt.next();
        });
      } else
      if (data == 'help') {
        write('There are only two commands:\r\nls\r\nhelp');
      } else {
        write('Unknown command! Type help to get command list.');
      }
    }
    pt.next();
  });

  function write(message) {
    socket.write('\r\n' + message + '\r\n');
  }

  pt.run();

}).listen(4300);



console.log("Server running\n");
//connection.end();