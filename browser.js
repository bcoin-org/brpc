'use strict';

exports.WebSocket = require('./lib/http/backend');
exports.Socket = require('./lib/http/socket');
exports.connect = exports.Socket.connect;
