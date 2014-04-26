var util = require('util');
var events = require('events');
var Readable = require('stream').Readable;
var debug = require('debug')('protok');

function Protok(options) {
  var self = this;

  this.reading = false;
  this.streamBytes = 0;

  this.nextWaiting = true;
  this.triggerWaiting = true;
  this.activeEmits = 0;
  this.slowedDown = false;
  this.interrupts = [];
  this.isActiveLine = false;

  if (!options.socket)
    throw new Error('No socket selected!')

  this.socket = options.socket;
  this.async = options.async || false;
  this.encoding = options.encoding || 'binary';
  this.separator = options.separator || "\r\n";
  this.buffer = new Buffer(0);

  events.EventEmitter.call(this);
}
util.inherits(Protok, events.EventEmitter);

Protok.prototype.run = function() {
  var self = this;

  this.socket.on('readable', function() {
    if (self.streamBytes === 0) {
      if (self.buffer.length < 4 * 1024) {

        var data = self.socket.read();

        if (data) {
          self.buffer = Buffer.concat([self.buffer, data]);
        }

        if (self.triggerWaiting) {
          self.triggerWaiting = false;
          self._next(true);
        }
      }
    } else {
      self.readStream();
    }
  });

  this.socket.on('end', function() {
    if (self.streamBytes > 0) {
      self.emit('stream_error');
    }
  });

  //this.socket.on('error', function() {
  //});
}

Protok.prototype.readMore = function() {
  var self = this;
  if (this.buffer.length < 4 * 1024) {
    debug('reading mooore!');
    var data = self.socket.read();
    if (data) {
      self.buffer = Buffer.concat([self.buffer, data]);
      //console.log(self.buffer.toString('utf8', 0, 1000));
    }

    if (self.triggerWaiting) {
      self.triggerWaiting = false;
      self._next(true);
    }
  }
}

Protok.prototype.readStream = function() {
  if (this.streamBytes === 0)
    return;
  if (this.reading) {
    debug('Bytes needed for current active stream: ' + this.streamBytes);
    var data = this.socket.read();

    if (data) {
      debug('Bytes received: ' + data.length);
      var b = 0;
      if (data.length > this.streamBytes) {
        b = this.streamBytes;
      }
      else
        b = data.length;

      var streamBuf = new Buffer(b);
      data.copy(streamBuf, 0, 0, b);
      data = data.slice(b);

      //this.buffer = data;

      this.buffer = Buffer.concat([this.buffer, data]);

      //console.log('C1 [ ', streamBuf.toString('utf8', 0, 1000), ' ]');
      //console.log('C2 [ ', this.buffer.toString('utf8', 0, 1000), ' ]');

      /*if (data.length - b > 0) {
       //this.buffer = Buffer.concat([this.buffer, data]);
       var b2 = data.length - b;
       
       //this.buffer = new Buffer(b2);
       //data.copy(this.buffer, 0, b, b + b2 + 10);
       
       console.log('C [ ', this.buffer.toString('utf8', 0, 1000), ' ]');
       }*/


      this.streamBytes -= streamBuf.length;

      if (!this.rs.push(streamBuf)) {
        this.reading = false;
      }

      if (this.streamBytes === 0) {
        this.rs.push(null);
        if (this.nextWaiting)
          this._next();
      }
    }
  }
}

Protok.prototype.isStreaming = function() {
  if (this.streamBytes > 0)
    return true;
  return false;
}

Protok.prototype.getStream = function(length) {
  var self = this;

  this.rs = Readable();

  if (length <= 0) {
    this.rs.push(null);
    return this.rs;
  }

  this.streamBytes = length;

  if (this.buffer.length > 0) {

    var b = 0;
    if (this.buffer.length > this.streamBytes)
      b = this.streamBytes;
    else
      b = this.buffer.length;

    var data = new Buffer(b);
    this.buffer.copy(data, 0, 0, b);
    this.buffer = this.buffer.slice(b);
    this.rs.push(data);
    this.streamBytes -= data.length;

    if (this.streamBytes === 0) {
      this.rs.push(null);
      if (this.nextWaiting)
        this._next();
    }
  }

  this.rs._read = function() {
    debug('stream _read requested');
    self.reading = true;

    if (this.streamBytes === 0) {
      this.rs.push(null);
      if (this.nextWaiting)
        this._next();
    }
    else
      self.readStream();
  };

  return this.rs;
}

Protok.prototype.pullLine = function() {
  for (i = 0; i < this.buffer.length; i++) {
    var buf2 = this.buffer.slice(i, i + this.separator.length);
    var str2 = buf2.toString();

    if (str2 === this.separator) {
      var tmp = this.buffer.slice(0, i);

      var line = new Buffer(tmp.length);
      tmp.copy(line);

      if (this.encoding !== 'binary') {
        line = line.toString(this.encoding)
      }

      this.buffer = this.buffer.slice(i + this.separator.length);
      this.isActiveLine = true;

      return line;
    }
  }
  return null;
}

Protok.prototype.processInterrupts = function() {
  debug('Processing one interrupt');
  var cb = this.interrupts.shift();
  return cb();
}

Protok.prototype.interrupt = function(cb) {
  this.interrupts.push(cb);
  debug('Adding interrupt');
  if (!this.isActiveLine) {
    this.nextWaiting = false;
    this.triggerWaiting = false;
    this.processInterrupts();
  }
}

Protok.prototype._next = function(fromRead) {
  var self = this;
  this.isActiveLine = false;

  if (this.interrupts.length > 0) {
    this.nextWaiting = false;
    this.triggerWaiting = false;
    return this.processInterrupts();
  }

  this.nextWaiting = true;

  if (this.streamBytes > 0)
    return;

  if (this.activeEmits > 10) {
    this.slowedDown = true;
    return;
  }

  var line = this.pullLine();

  if (line !== null) {
    this.processLine(line);
    if (!fromRead)
      this.readMore();
    if (this.async) {
      //process.nextTick(function() {
      self._next();
      //});
    } else {
      this.nextWaiting = false;
    }
  }

  if (this.nextWaiting)
    this.triggerWaiting = true;
}

Protok.prototype.next = function() {
  if (this.async === false)
    this._next();
}

Protok.prototype.processLine = function(line) {
  // Only one type of listeners is allowed
  if (this.listeners('json').length > 0) {
    debug('Processing JSON');
    try {
      data = JSON.parse(line);
    } catch (exception) {
      data = null;
    }

    if (data) {
      defferredEmit.call(this, 'json', data);
      //this.emit('json', data);
    }
  } else {
    defferredEmit.call(this, 'line', line);
  }
}

exports.create = function(options) {
  return new Protok(options);
}

function defferredEmit() {
  debug('Active emits: ' + this.activeEmits);
  this.activeEmits++;

  var self = this;
  var args = arguments;

  var fn;
  if (this.async)
    fn = process.nextTick;
  else
    fn = setImmediate;

  fn.call(this, function() {
    //setImmediate(function() {
    self.activeEmits--;
    self.emit.apply(self, args);

    if (self.slowedDown && self.activeEmits < 10) {
      self.slowedDown = false;
      self._next();
    }
  });
}