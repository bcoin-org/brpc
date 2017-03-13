'use strict';

exports.ws = require('faye-websocket');
exports.Server = require('./lib/http/server');
exports.createServer = exports.Server.createServer;
exports.attach = exports.Server.attach;
exports.Socket = require('./lib/http/socket');
exports.connect = exports.Socket.connect;

exports.tcp = {};
exports.tcp.Server = require('./lib/net/server');
exports.tcp.createServer = exports.tcp.Server.createServer;
exports.tcp.attach = exports.tcp.Server.attach;
exports.tcp.Socket = require('./lib/net/socket');
exports.tcp.connect = exports.tcp.Socket.connect;
