'use strict';

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var WebSocket = require('./backend');
var Packet = require('../packet');
var BaseSocket = require('../base');

/**
 * RPCSocket
 * @constructor
 * @ignore
 */

function Socket(socket) {
  if (!(this instanceof Socket))
    return new Socket(socket);

  BaseSocket.call(this, socket);

  this.socket = socket || null;

  if (socket)
    this.init();
}

util.inherits(Socket, BaseSocket);

Socket.prototype.bind = function bind() {
  var self = this;

  this.socket.onopen = function() {
    self.connected = true;
    self.emit('open');
  };

  this.socket.onmessage = function(event) {
    var data = event.data;

    if (!data)
      return;

    if (!Buffer.isBuffer(data)) {
      if (!data.buffer)
        return;

      data = new Buffer(data.buffer);
    }

    self.handleMessage(data, false).catch(function(err) {
      self.emit('error', err);
      self.destroy();
    });
  };

  this.socket.onerror = function(event) {
    self.emit('error', new Error(event.message));
    self.destroy();
  };

  this.socket.onclose = function() {
    self.destroy();
  };
};

Socket.prototype.close = function close() {
  this.socket.close();
};

Socket.prototype.send = function send(packet) {
  this.socket.send(packet.toRaw());
};

Socket.prototype.connect = function connect(port, host, wss) {
  var protocol = 'ws';

  assert(typeof port === 'number', 'Must pass a port.');

  if (wss)
    protocol = 'wss';

  if (!host)
    host = 'localhost';

  assert(!this.socket);

  this.socket = new WebSocket(protocol + '://' + host + ':' + port);
  this.init();
};

Socket.connect = function connect(port, host, wss) {
  var socket = new Socket();
  socket.connect(port, host, wss);
  return socket;
};

/*
 * Expose
 */

module.exports = Socket;
