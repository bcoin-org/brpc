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

  this.socket.on('connect', function() {
    self.connected = true;
    self.emit('open');
  });

  this.socket.on('data', function(data) {
    self.parser.feed(data);
  });

  this.parser.on('message', function(data) {
    self.handleMessage(data, true).catch(function(err) {
      self.emit('error', err);
      self.destroy();
    });
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
  this.socket.write(packet.toRaw());
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
