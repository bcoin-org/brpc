'use strict';

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var Packet = require('./packet');
var DUMMY = new Buffer(0);

/**
 * RPCBaseSocket
 * @constructor
 * @ignore
 */

function BaseSocket(socket) {
  if (!(this instanceof BaseSocket))
    return new BaseSocket(socket);

  EventEmitter.call(this);

  this.socket = null;
  this.parser = null;
  this.jobs = {};
  this.hooks = {};
  this.events = new EventEmitter();
  this.start = 0;
  this.sequence = 0;
  this.connected = false;
  this.destroyed = false;
  this.host = '0.0.0.0';
  this.port = 0;
}

util.inherits(BaseSocket, EventEmitter);

BaseSocket.prototype.init = function init() {
  var self = this;

  this.start = Date.now();

  this.bind();

  this.parser.on('error', function(err) {
    self.emit('error', err);
    self.destroy();
  });

  this.parser.on('message', function(packet) {
    self.handleMessage(packet).catch(function(err) {
      self.emit('error', err);
      self.destroy();
    });
  });

  this.startStall();
};

BaseSocket.prototype.bind = function bind() {
  throw new Error('Abstract method.');
};

BaseSocket.prototype.close = function close() {
  throw new Error('Abstract method.');
};

BaseSocket.prototype.send = function send(packet) {
  throw new Error('Abstract method.');
};

BaseSocket.prototype.connect = function connect(port, host, wss) {
  throw new Error('Abstract method.');
};

BaseSocket.prototype.startStall = function startStall() {
  assert(this.timer == null);
  this.timer = setTimeout(this.maybeStall.bind(this), 5000);
};

BaseSocket.prototype.stopStall = function stopStall() {
  assert(this.timer != null);
  clearTimeout(this.timer);
  this.timer = null;
};

BaseSocket.prototype.maybeStall = function maybeStall() {
  var now = Date.now();
  var i, keys, key, job;

  if (!this.connected) {
    if (now - this.start > 10000) {
      this.error('Timed out waiting for connection.');
      this.destroy();
      return;
    }
    return;
  }

  keys = Object.keys(this.jobs);

  for (i = 0; i < keys.length; i++) {
    key = keys[i];
    job = this.jobs[key];
    if (now - job.ts > 10000) {
      delete this.jobs[key];
      job.reject(new Error('Job timed out.'));
    }
  }

  if (!this.challenge) {
    this.challenge = util.nonce();
    this.lastPing = now;
    this.sendPing(this.challenge);
    return;
  }

  if (now - this.lastPing > 30000) {
    this.error('Connection is stalling (ping).');
    this.destroy();
    return;
  }
};

BaseSocket.prototype.error = function error(msg) {
  if (!(msg instanceof Error))
    msg = new Error(msg + '');

  this.emit('error', msg);
};

BaseSocket.prototype.destroy = function destroy() {
  var jobs = this.jobs;
  var keys = Object.keys(jobs);
  var i, key, job;

  if (this.destroyed)
    return;

  this.close();
  this.stopStall();

  this.connected = false;
  this.challenge = null;
  this.destroyed = true;

  this.jobs = {};

  for (i = 0; i < keys.length; i++) {
    key = keys[i];
    job = jobs[key];
    job.reject(new Error('Socket was destroyed.'));
  }

  this.emit('close');
};

BaseSocket.prototype.handleMessage = function handleMessage(packet) {
  var result;
  try {
    result = this._handleMessage(packet);
    return cast(result);
  } catch (e) {
    return Promise.reject(e);
  }
};

BaseSocket.prototype._handleMessage = function handleMessage(packet) {
  var result;

  switch (packet.type) {
    case Packet.types.EVENT:
      this.handleEvent(packet.event, packet.payload);
      break;
    case Packet.types.CALL:
      result = this.handleCall(packet.id, packet.event, packet.payload);
      break;
    case Packet.types.ACK:
      this.handleAck(packet.id, packet.payload);
      break;
    case Packet.types.ERROR:
      this.handleError(packet.id, packet.code, packet.msg);
      break;
    case Packet.types.PING:
      this.handlePing(packet.payload);
      break;
    case Packet.types.PONG:
      this.handlePong(packet.payload);
      break;
    default:
      throw new Error('Unknown packet.');
  }

  return result;
};

BaseSocket.prototype.handleEvent = function handleEvent(event, data) {
  this.events.emit(event, data);
};

BaseSocket.prototype.handleCall = function handleCall(id, event, data) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var hook = self.hooks[event];
    var result;

    if (!hook) {
      reject(new Error('Call not found: ' + event + '.'));
      return;
    }

    try {
      result = hook(data);
    } catch (e) {
      reject(e);
      return;
    }

    cast(result).then(function(result) {
      if (result == null)
        result = DUMMY;

      assert(Buffer.isBuffer(result));

      self.sendAck(id, result);

      resolve();
    }, function(err) {
      self.sendError(id, ~~err.code, err.message + '');
      resolve();
    }).catch(reject);
  });
};

BaseSocket.prototype.handleAck = function handleAck(id, data) {
  var job = this.jobs[id];

  if (!job)
    throw new Error('Job not found for ' + id + '.');

  delete this.jobs[id];

  job.resolve(data);
};

BaseSocket.prototype.handleError = function handleError(id, code, msg) {
  var job = this.jobs[id];
  var err;

  if (!job)
    throw new Error('Job not found for ' + id + '.');

  delete this.jobs[id];

  err = new Error(msg);
  err.code = code;

  job.reject(err);
};

BaseSocket.prototype.handlePing = function handlePing(nonce) {
  this.sendPong(nonce);
};

BaseSocket.prototype.handlePong = function handlePong(nonce) {
  if (!this.challenge || nonce.compare(this.challenge) !== 0) {
    this.error('Remote node sent bad pong.');
    this.destroy();
    return;
  }
  this.challenge = null;
};

BaseSocket.prototype.sendEvent = function sendEvent(event, data) {
  var packet = new Packet();
  packet.type = Packet.types.EVENT;
  packet.event = event;
  packet.payload = data;
  this.send(packet);
};

BaseSocket.prototype.sendCall = function sendCall(id, event, data) {
  var packet = new Packet();
  packet.type = Packet.types.CALL;
  packet.id = id;
  packet.event = event;
  packet.payload = data;
  this.send(packet);
};

BaseSocket.prototype.sendAck = function sendAck(id, data) {
  var packet = new Packet();
  packet.type = Packet.types.ACK;
  packet.id = id;
  packet.payload = data;
  this.send(packet);
};

BaseSocket.prototype.sendError = function sendError(id, code, msg) {
  var packet = new Packet();
  packet.type = Packet.types.ERROR;
  packet.id = id;
  packet.msg = msg;
  packet.code = code;
  this.send(packet);
};

BaseSocket.prototype.sendPing = function sendPing(nonce) {
  var packet = new Packet();
  packet.type = Packet.types.PING;
  packet.payload = nonce;
  this.send(packet);
};

BaseSocket.prototype.sendPong = function sendPong(nonce) {
  var packet = new Packet();
  packet.type = Packet.types.PONG;
  packet.payload = nonce;
  this.send(packet);
};

BaseSocket.prototype.fire = function fire(event, data) {
  if (data == null)
    data = DUMMY;

  assert(typeof event === 'string', 'Event must be a string.');
  assert(Buffer.isBuffer(data), 'Data must be a buffer.');

  this.sendEvent(event, data);
};

BaseSocket.prototype.call = function call(event, data) {
  var self = this;
  var id = this.sequence;

  if (data == null)
    data = DUMMY;

  assert(typeof event === 'string', 'Event must be a string.');
  assert(Buffer.isBuffer(data), 'Data must be a buffer.');

  if (++this.sequence === 0x100000000)
    this.sequence = 0;

  this.sendCall(id, event, data);

  assert(!this.jobs[id], 'ID collision.');

  return new Promise(function(resolve, reject) {
    self.jobs[id] = new Job(resolve, reject, Date.now());
  });
};

BaseSocket.prototype.listen = function listen(event, handler) {
  assert(typeof event === 'string', 'Event must be a string.');
  assert(typeof handler === 'function', 'Handler must be a function.');
  this.events.on(event, handler);
};

BaseSocket.prototype.hook = function hook(event, handler) {
  assert(typeof event === 'string', 'Event must be a string.');
  assert(typeof handler === 'function', 'Handler must be a function.');
  assert(!this.hooks[event], 'Hook already bound.');
  this.hooks[event] = handler;
};

BaseSocket.connect = function connect(port, host, wss) {
  throw new Error('Abstract method.');
};

/*
 * Helpers
 */

function Job(resolve, reject, ts) {
  this.resolve = resolve;
  this.reject = reject;
  this.ts = ts;
}

function cast(result) {
  if (!result)
    return Promise.resolve();

  if (typeof result.then !== 'function')
    return Promise.resolve(result);

  return result;
}

/*
 * Expose
 */

module.exports = BaseSocket;
