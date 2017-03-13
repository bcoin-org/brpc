/*!
 * parser.js - packet parser for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('../util');

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

  this.pending = [];
  this.total = 0;
  this.waiting = 4;
  this.hasSize = false;
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
 * @param {...String} msg
 */

Parser.prototype.error = function error() {
  var msg = util.fmt.apply(util, arguments);
  this.emit('error', new Error(msg));
};

/**
 * Feed data to the parser.
 * @param {Buffer} data
 */

Parser.prototype.feed = function feed(data) {
  var chunk, off, len;

  this.total += data.length;
  this.pending.push(data);

  while (this.total >= this.waiting) {
    chunk = new Buffer(this.waiting);
    off = 0;
    len = 0;

    while (off < chunk.length) {
      len = this.pending[0].copy(chunk, off);
      if (len === this.pending[0].length)
        this.pending.shift();
      else
        this.pending[0] = this.pending[0].slice(len);
      off += len;
    }

    assert.equal(off, chunk.length);

    this.total -= chunk.length;
    this.parse(chunk);
  }
};

/**
 * Parse a fully-buffered chunk.
 * @param {Buffer} chunk
 */

Parser.prototype.parse = function parse(data) {
  assert(data.length <= Parser.MAX_MESSAGE);

  if (!this.hasSize) {
    this.waiting = data.readUInt32LE(0, true);
    this.waiting += 1;
    if (this.waiting > Parser.MAX_MESSAGE) {
      this.waiting = 4;
      this.error('Packet too large.');
      return;
    }
    this.hasSize = true;
    return;
  }

  this.waiting = 4;
  this.hasSize = false;

  this.emit('message', data);
};

/*
 * Expose
 */

module.exports = Parser;
