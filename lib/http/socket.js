'use strict';

/* global Blob */
/* global FileReader */

var assert = require('assert');
var URL = require('url');
var util = require('../util');
var WebSocket = require('./backend').Client;
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
  var socket = this.socket;
  var url = URL.parse(socket.url);

  this.host = url.hostname;
  this.port = +url.port;

  socket.binaryType = 'arraybuffer';

  socket.onopen = function() {
    self.connected = true;
    self.emit('open');
  };

  socket.onmessage = function(event) {
    readBinary(event.data).then(function(data) {
      return self.handleMessage(data, false);
    }).catch(function(err) {
      self.emit('error', err);
      self.destroy();
    });
  };

  socket.onerror = function(event) {
    self.emit('error', new Error(event.message));
    self.destroy();
  };

  socket.onclose = function(event) {
    if (event.code < 1002) {
      self.destroy();
      return;
    }
    self.emit('error', new Error(event.reason));
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
 * Helpers
 */

function readBinary(data) {
  return new Promise(function(resolve, reject) {
    var reader;

    if (!data || typeof data !== 'object') {
      reject(new Error('Bad data object.'));
      return;
    }

    if (Buffer.isBuffer(data)) {
      resolve(data);
      return;
    }

    if (data instanceof ArrayBuffer) {
      data = new Buffer(data);
      resolve(data);
      return;
    }

    if (data.buffer instanceof ArrayBuffer) {
      data = new Buffer(data.buffer);
      resolve(data);
      return;
    }

    if (typeof Blob !== 'undefined' && Blob) {
      if (data instanceof Blob) {
        reader = new FileReader();
        reader.onloadend = function() {
          var result = reader.result;
          result = new Buffer(result);
          resolve(result);
        };
        reader.readAsArrayBuffer(data);
        return;
      }
    }

    reject(new Error('Bad data object.'));
  });
}

/*
 * Expose
 */

module.exports = Socket;
