var fs = require('fs');
var s = require('net').Socket();
s.connect(4300, '127.0.0.1');
//s.connect(4300, 'localhost');
s.write('{"1":"' + 10 + '","filesize": ' + 10 + '}\r\n'
        + '{"2":"' + 10 + '","filesize": ' + 10 + '}\r\n'
        + '{"3":"' + 10 + '","filesize": ' + 10 + '}\r\n'
        + '{"4":"' + 10 + '","filesize": ' + 10 + '}\r\n'
        + '{"5":"' + 10 + '","filesize": ' + 10 + '}\r\n'
        + '{"6":"' + 10 + '","filesize": ' + 10 + '}\r\n'
        );

