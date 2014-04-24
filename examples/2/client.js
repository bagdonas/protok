var fs = require('fs');
var s = require('net').Socket();
s.connect(4300, '127.0.0.1');
//s.connect(4300, 'localhost');

var n = 0;
function sendFile() {
  s.write('{"1":"' + 10 + '","filesize": ' + 10 + '}\r\n'
          + '{"2":"' + 10 + '","filesize": ' + 10 + '}\r\n'
          + '{"3":"' + 10 + '","filesize": ' + 10 + '}\r\n'
          + '{"4":"' + 10 + '","filesize": ' + 10 + '}\r\n'
          + '{"5":"' + 10 + '","filesize": ' + 10 + '}\r\n'
          + '{"6":"' + 10 + '","filesize": ' + 10 + '}\r\n'
          + '{"user":"foo","password": "bar"}\r\n'

          , 'utf8', function() {

            //var file = 'a.txt';
            //var file = 'a.htm';
            //var file = '1.jpg';
            var file = '/ebs3/photos2/Paskutines/ss1/20130215_223541.mp4';

            var stats = fs.statSync(file)
            var fileSizeInBytes = stats["size"];

            //s.write('{"filename":"' + file + '","filesize": ' + fileSizeInBytes + '}\r\n', 'UTF8', function() {
            s.write('{"filename":"20130215_223541.mp4","filesize": ' + fileSizeInBytes + '}\r\n', 'utf8', function() {
              var rs = fs.createReadStream(file);

              rs.on('end', function(d) {
                setTimeout(function() {
                n++;
                if (n <= 2) {
                  
                  sendFile();
                }
                }, 30000);
              });

              rs.pipe(s, {end: false});




            });


          });















}
s.on('data', function(d) {
  console.log(d.toString());
});

sendFile();


setTimeout(function() {



}, 200000);