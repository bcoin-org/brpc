/*!
 * parser.js - packet parser for brpc
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/brpc
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var crc32 = require('../crc32');
var Packet = require('../packet');
var Header = Packet.Header;

/**
 * Protocol packet parser
 * @constructor
 * @emits Parser#error
 * @emits Parser#packet
 */

function Parser(network) {
  if (!(this instanceof Parser))
    return new Parser(network);

  EventEmitter.call(this);
}

util.inherits(Parser, EventEmitter);

/**
 * Max message size.
 * @const {Number}
 * @default
 */

Parser.MAX_MESSAGE = 10000000;

/**
 * Emit an error.
 * @private
 * @param {String} msg
 */

Parser.prototype.error = function error(msg) {
  this.emit('error', new Error(msg));
};

/**
 * Feed data to the parser.
 * @param {Buffer} data
 */

Parser.prototype.feed = function feed(data) {
  var header, packet;

  try {
    header = Header.fromRaw(data);
    if (header.size > Parser.MAX_MESSAGE) {
      this.error('Packet too large.');
      return;
    }
    data = data.slice(9);
    packet = Packet.fromRaw(header.type, data);
  } catch (e) {
    this.emit('error', e);
    return;
  }

  if (header.chk !== crc32(data)) {
    this.error('Checksum mismatch.');
    return;
  }

  this.emit('message', packet);
};

/*
 * Expose
 */

module.exports = Parser;

