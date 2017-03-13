/*!
 * reader.js - buffer reader for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var assert = require('assert');
var encoding = require('./encoding');

/**
 * An object that allows reading of buffers in a sane manner.
 * @alias module:utils.BufferReader
 * @constructor
 * @param {Buffer} data
 * @param {Boolean?} zeroCopy - Do not reallocate buffers when
 * slicing. Note that this can lead to memory leaks if not used
 * carefully.
 */

function BufferReader(data, zeroCopy) {
  if (!(this instanceof BufferReader))
    return new BufferReader(data, zeroCopy);

  assert(Buffer.isBuffer(data), 'Must pass a Buffer.');

  this.data = data;
  this.offset = 0;
  this.zeroCopy = zeroCopy || false;
}

/**
 * Get total size of passed-in Buffer.
 * @returns {Buffer}
 */

BufferReader.prototype.getSize = function getSize() {
  return this.data.length;
};

/**
 * Calculate number of bytes left to read.
 * @returns {Number}
 */

BufferReader.prototype.left = function left() {
  assert(this.offset <= this.data.length);
  return this.data.length - this.offset;
};

/**
 * Seek to a position to read from by offset.
 * @param {Number} off - Offset (positive or negative).
 */

BufferReader.prototype.seek = function seek(off) {
  assert(this.offset + off >= 0);
  assert(this.offset + off <= this.data.length);
  this.offset += off;
  return off;
};

/**
 * Read uint8.
 * @returns {Number}
 */

BufferReader.prototype.readU8 = function readU8() {
  var ret;
  assert(this.offset + 1 <= this.data.length);
  ret = this.data[this.offset];
  this.offset += 1;
  return ret;
};

/**
 * Read uint16le.
 * @returns {Number}
 */

BufferReader.prototype.readU16 = function readU16() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readUInt16LE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read uint16be.
 * @returns {Number}
 */

BufferReader.prototype.readU16BE = function readU16BE() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readUInt16BE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read uint32le.
 * @returns {Number}
 */

BufferReader.prototype.readU32 = function readU32() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readUInt32LE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read uint32be.
 * @returns {Number}
 */

BufferReader.prototype.readU32BE = function readU32BE() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readUInt32BE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read int8.
 * @returns {Number}
 */

BufferReader.prototype.read8 = function read8() {
  var ret;
  assert(this.offset + 1 <= this.data.length);
  ret = this.data.readInt8(this.offset, true);
  this.offset += 1;
  return ret;
};

/**
 * Read int16le.
 * @returns {Number}
 */

BufferReader.prototype.read16 = function read16() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readInt16LE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read int16be.
 * @returns {Number}
 */

BufferReader.prototype.read16BE = function read16BE() {
  var ret;
  assert(this.offset + 2 <= this.data.length);
  ret = this.data.readInt16BE(this.offset, true);
  this.offset += 2;
  return ret;
};

/**
 * Read int32le.
 * @returns {Number}
 */

BufferReader.prototype.read32 = function read32() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readInt32LE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read int32be.
 * @returns {Number}
 */

BufferReader.prototype.read32BE = function read32BE() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readInt32BE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read float le.
 * @returns {Number}
 */

BufferReader.prototype.readFloat = function readFloat() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readFloatLE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read float be.
 * @returns {Number}
 */

BufferReader.prototype.readFloatBE = function readFloatBE() {
  var ret;
  assert(this.offset + 4 <= this.data.length);
  ret = this.data.readFloatBE(this.offset, true);
  this.offset += 4;
  return ret;
};

/**
 * Read double float le.
 * @returns {Number}
 */

BufferReader.prototype.readDouble = function readDouble() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = this.data.readDoubleLE(this.offset, true);
  this.offset += 8;
  return ret;
};

/**
 * Read double float be.
 * @returns {Number}
 */

BufferReader.prototype.readDoubleBE = function readDoubleBE() {
  var ret;
  assert(this.offset + 8 <= this.data.length);
  ret = this.data.readDoubleBE(this.offset, true);
  this.offset += 8;
  return ret;
};

/**
 * Read a varint.
 * @returns {Number}
 */

BufferReader.prototype.readVarint = function readVarint() {
  var result = encoding.readVarint(this.data, this.offset);
  this.offset += result.size;
  return result.value;
};

/**
 * Skip past a varint.
 * @returns {Number}
 */

BufferReader.prototype.skipVarint = function skipVarint() {
  var size = encoding.skipVarint(this.data, this.offset);
  assert(this.offset + size <= this.data.length);
  this.offset += size;
};

/**
 * Read N bytes (will do a fast slice if zero copy).
 * @param {Number} size
 * @param {Bolean?} zeroCopy - Do a fast buffer
 * slice instead of allocating a new buffer (warning:
 * may cause memory leaks if not used with care).
 * @returns {Buffer}
 */

BufferReader.prototype.readBytes = function readBytes(size, zeroCopy) {
  var ret;

  assert(size >= 0);
  assert(this.offset + size <= this.data.length);

  if (this.zeroCopy || zeroCopy) {
    ret = this.data.slice(this.offset, this.offset + size);
  } else {
    ret = new Buffer(size);
    this.data.copy(ret, 0, this.offset, this.offset + size);
  }

  this.offset += size;

  return ret;
};

/**
 * Read a varint number of bytes (will do a fast slice if zero copy).
 * @param {Bolean?} zeroCopy - Do a fast buffer
 * slice instead of allocating a new buffer (warning:
 * may cause memory leaks if not used with care).
 * @returns {Buffer}
 */

BufferReader.prototype.readVarBytes = function readVarBytes(zeroCopy) {
  return this.readBytes(this.readVarint(), zeroCopy);
};

/**
 * Read a string.
 * @param {String} enc - Any buffer-supported encoding.
 * @param {Number} size
 * @returns {String}
 */

BufferReader.prototype.readString = function readString(enc, size) {
  var ret;
  assert(size >= 0);
  assert(this.offset + size <= this.data.length);
  ret = this.data.toString(enc, this.offset, this.offset + size);
  this.offset += size;
  return ret;
};

/**
 * Read string of a varint length.
 * @param {String} enc - Any buffer-supported encoding.
 * @param {Number?} limit - Size limit.
 * @returns {String}
 */

BufferReader.prototype.readVarString = function readVarString(enc, limit) {
  var size = this.readVarint();
  assert(!limit || size <= limit, 'String exceeds limit.');
  return this.readString(enc, size);
};

/*
 * Expose
 */

module.exports = BufferReader;
