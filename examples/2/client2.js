var fs = require('fs');
var s = require('net').Socket();
s.connect(4300, '127.0.0.1');
//s.connect(4300, 'localhost');

function sendFile() {
  for (var i = 0; i < 100000; i++) {
    s.write('{"1":"' + i + '","filesize": ' + 10 + '}\r\n'
            + '{"2":"' + 10 + '","filesize": ' + 10 + '}\r\n'
            + '{"3":"' + 10 + '","filesize": ' + 10 + '}\r\n'
            + '{"4":"' + 10 + '","filesize": ' + 10 + '}\r\n'
            + '{"5":"' + 10 + '","filesize": ' + 10 + '}\r\n'
            + '{"6":"' + 10 + '","filesize": ' + 10 + '}\r\n'
            + '{"user":"fdoo","password": "bar"}\r\n'
            , 'utf8');

  }














  s.on('data', function(d) {
    console.log(d.toString());
  });



}


sendFile();


setTimeout(function() {



}, 200000);