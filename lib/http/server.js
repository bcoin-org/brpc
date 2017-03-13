'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var WebSocket = require('faye-websocket');
var Socket = require('./socket');

function Server(options) {
  if (!(this instanceof Server))
    return new Server(options);

  EventEmitter.call(this);
}

util.inherits(Server, EventEmitter);

Server.prototype.attach = function attach(server) {
  var self = this;

  server.on('upgrade', function(request, socket, body) {
    var ws, rpc;

    if (WebSocket.isWebSocket(request)) {
      ws = new WebSocket(request, socket, body);
      rpc = new Socket(ws);
      self.emit('socket', rpc);
    }
  });

  return this;
};

Server.attach = function attach(http, options) {
  var server = new Server(options);
  return server.attach(http);
};

Server.createServer = function createServer(options) {
  return new Server(options);
};

module.exports = Server;
