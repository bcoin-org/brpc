'use strict';

var assert = require('assert');
var net = require('net');
var util = require('../util');
var Parser = require('./parser');
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
  this.parser = new Parser();

  if (socket)
    this.init();
}

util.inherits(Socket, BaseSocket);

Socket.prototype.bind = function bind() {
  var self = this;

  this.host = this.socket.remoteAddress;
  this.port = this.socket.remotePort;

  this.socket.on('connect', function() {
    self.host = self.socket.remoteAddress;
    self.port = self.socket.remotePort;
    self.connected = true;
    self.emit('open');
  });

  this.socket.on('data', function(data) {
    self.parser.feed(data);
  });

  this.socket.on('error', function(err) {
    self.emit('error', err);
    self.destroy();
  });

  this.socket.on('close', function() {
    self.destroy();
  });
};

Socket.prototype.close = function close() {
  this.socket.destroy();
};

Socket.prototype.send = function send(packet) {
  this.socket.write(packet.frame());
};

Socket.prototype.connect = function connect(port, host, wss) {
  assert(typeof port === 'number', 'Must pass a port.');
  assert(!wss, 'Cannot use wss.');

  assert(!this.socket);

  this.socket = net.connect(port, host);

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
