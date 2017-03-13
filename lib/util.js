/*!
 * util.js - utils for brpc
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/brpc
 */

'use strict';

/**
 * @module utils/encoding
 */

var util = exports;

/**
 * Inheritance.
 * @param {Function} obj - Constructor to inherit.
 * @param {Function} from - Parent constructor.
 */

util.inherits = function inherits(obj, from) {
  var f = function() {};
  f.prototype = from.prototype;
  obj.prototype = new f;
  obj.prototype.constructor = obj;
};

/**
 * Create a 64 bit nonce.
 * @returns {Buffer}
 */

util.nonce = function _nonce() {
  var nonce = new Buffer(8);
  var a = (Math.random() * 0x100000000) >>> 0;
  var b = (Math.random() * 0x100000000) >>> 0;

  nonce.writeUInt32LE(a, 0, true);
  nonce.writeUInt32LE(b, 4, true);

  return nonce;
};

