
var net = require('net');
var carrier = require('../../');



// Start a TCP Server
net.createServer(function(socket) {

  var cr = carrier.carry(socket);
  cr.on('line', function(data) {


    var json;
    try {
      json = JSON.parse(data);
    } catch (exception) {
      json = null;
    }

    setTimeout(function() {
      var j=json;
      console.log(j);
      cr.next();
    }, Math.random()*(500-100)+100);


    
  });


  socket.on('end', function() {

  });
}).listen(4300);
console.log("Server running\n");
