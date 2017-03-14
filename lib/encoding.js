/*!
 * encoding.js - encoding utils for brpc
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/brpc
 */

'use strict';

/**
 * @module utils/encoding
 */

var assert = require('assert');
var encoding = exports;

/**
 * Read a varint.
 * @param {Buffer} data
 * @param {Number} off
 * @returns {Object}
 */

encoding.readVarint = function readVarint(data, off) {
  var value, size;

  assert(off < data.length);

  switch (data[off]) {
    case 0xff:
      assert(false, 'uint64 varints not supported.');
      break;
    case 0xfe:
      size = 5;
      assert(off + size <= data.length);
      value = data.readUInt32LE(off + 1, true);
      assert(value > 0xffff);
      break;
    case 0xfd:
      size = 3;
      assert(off + size <= data.length);
      value = data[off + 1] | (data[off + 2] << 8);
      assert(value >= 0xfd);
      break;
    default:
      size = 1;
      value = data[off];
      break;
  }

  return new Varint(size, value);
};

/**
 * Write a varint.
 * @param {Buffer} dst
 * @param {Number} num
 * @param {Number} off
 * @returns {Number} Buffer offset.
 */

encoding.writeVarint = function writeVarint(dst, num, off) {
  if (num < 0xfd) {
    dst[off++] = num & 0xff;
    return off;
  }

  if (num <= 0xffff) {
    dst[off++] = 0xfd;
    dst[off++] = num & 0xff;
    dst[off++] = (num >> 8) & 0xff;
    return off;
  }

  if (num <= 0xffffffff) {
    dst[off++] = 0xfe;
    dst[off++] = num & 0xff;
    dst[off++] = (num >> 8) & 0xff;
    dst[off++] = (num >> 16) & 0xff;
    dst[off++] = num >>> 24;
    return off;
  }

  assert(false, 'uint64 varints not supported.');
};

/**
 * Read a varint size.
 * @param {Buffer} data
 * @param {Number} off
 * @returns {Number}
 */

encoding.skipVarint = function skipVarint(data, off) {
  assert(off < data.length);

  switch (data[off]) {
    case 0xff:
      assert(false, 'uint64 varints not supported.');
      break;
    case 0xfe:
      return 5;
    case 0xfd:
      return 3;
    default:
      return 1;
  }
};

/**
 * Calculate size of varint.
 * @param {Number} num
 * @returns {Number} size
 */

encoding.sizeVarint = function sizeVarint(num) {
  if (num < 0xfd)
    return 1;

  if (num <= 0xffff)
    return 3;

  if (num <= 0xffffffff)
    return 5;

  assert(false, 'uint64 varints not supported.');
};

/*
 * Helpers
 */

function Varint(size, value) {
  this.size = size;
  this.value = value;
}
