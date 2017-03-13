/*!
 * encoding.js - encoding utils for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/**
 * @module utils/encoding
 */

var assert = require('assert');
var encoding = exports;

/**
 * Inheritance.
 * @param {Function} obj - Constructor to inherit.
 * @param {Function} from - Parent constructor.
 */

exports.inherits = function inherits(obj, from) {
  var f = function() {};
  f.prototype = from.prototype;
  obj.prototype = new f;
  obj.prototype.constructor = obj;
};

/**
 * Create a 64 bit nonce.
 * @returns {Buffer}
 */

exports.nonce = function _nonce() {
  var nonce = new Buffer(8);
  var a = (Math.random() * 0x100000000) >>> 0;
  var b = (Math.random() * 0x100000000) >>> 0;

  nonce.writeUInt32LE(a, 0, true);
  nonce.writeUInt32LE(b, 4, true);

  return nonce;
};

