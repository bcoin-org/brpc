'use strict';

exports.ws = require('./lib/http/backend');
exports.Socket = require('./lib/http/socket');
exports.connect = exports.Socket.connect;

window.brpc = exports;
