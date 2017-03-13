'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var Socket = require('./socket');

function Server(options) {
  if (!(this instanceof Server))
    return new Server(options);

  EventEmitter.call(this);
}

util.inherits(Server, EventEmitter);

Server.prototype.attach = function attach(server) {
  var self = this;

  server.on('connection', function(socket) {
    var ws;

    if (socket.remoteAddress) {
      ws = new Socket(socket);
      self.emit('socket', ws);
    }
  });

  return this;
};

Server.attach = function attach(tcp, options) {
  var server = new Server(options);
  return server.attach(tcp);
};

Server.createServer = function createServer(options) {
  return new Server(options);
};

module.exports = Server;
