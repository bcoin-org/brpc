'use strict';

var encoding = require('./encoding');
var BufferReader = require('./reader');
var StaticWriter = require('./writer');
var crc32 = require('./crc32');
var DUMMY = new Buffer(0);

/**
 * Header
 * @constructor
 */

function Header() {
  this.type = 0;
  this.size = 0;
  this.chk = 0;
}

Header.prototype.fromRaw = function fromRaw(data) {
  var br = new BufferReader(data);
  this.type = br.readU8();
  this.size = br.readU32();
  this.chk = br.readU32();
  return this;
};

Header.fromRaw = function fromRaw(data) {
  return new Header().fromRaw(data);
};

/**
 * Packet
 * @constructor
 */

function Packet() {
  this.type = 0;
  this.id = 0;
  this.event = '';
  this.payload = DUMMY;
  this.code = 0;
  this.msg = '';
}

Packet.types = {
  EVENT: 0,
  CALL: 1,
  ACK: 2,
  ERROR: 3,
  PING: 4,
  PONG: 5
};

Packet.prototype.fromRaw = function fromRaw(type, data) {
  var br = new BufferReader(data);
  var id = -1;
  var event = null;
  var payload = null;
  var code = 0;
  var msg = '';
  var size;

  switch (type) {
    case Packet.types.EVENT:
      size = br.readU8();
      event = br.readString('ascii', size);
      payload = br.readBytes(br.left());
      break;
    case Packet.types.CALL:
      size = br.readU8();
      event = br.readString('ascii', size);
      id = br.readU32();
      payload = br.readBytes(br.left());
      break;
    case Packet.types.ACK:
      id = br.readU32();
      payload = br.readBytes(br.left());
      break;
    case Packet.types.ERROR:
      id = br.readU32();
      code = br.readU8();
      size = br.readU8();
      msg = br.readString('ascii', size);
      break;
    case Packet.types.PING:
      payload = br.readBytes(8);
      break;
    case Packet.types.PONG:
      payload = br.readBytes(8);
      break;
    default:
      throw new Error('Unknown message type.');
  }

  if (br.left() > 0)
    throw new Error('Trailing data.');

  this.type = type;
  this.id = id;
  this.event = event;
  this.payload = payload;
  this.code = code;
  this.msg = msg;

  return this;
};

Packet.fromRaw = function fromRaw(type, data) {
  return new Packet().fromRaw(type, data);
};

Packet.prototype.getSize = function getSize() {
  var size = 0;
  var i, item;

  switch (this.type) {
    case Packet.types.EVENT:
      size += 1;
      size += this.event.length;
      size += this.payload.length;
      break;
    case Packet.types.CALL:
      size += 1;
      size += this.event.length;
      size += 4;
      size += this.payload.length;
      break;
    case Packet.types.ACK:
      size += 4;
      size += this.payload.length;
      break;
    case Packet.types.ERROR:
      size += 4;
      size += 1;
      size += 1;
      size += this.msg.length;
      break;
    case Packet.types.PING:
      size += 8;
      break;
    case Packet.types.PONG:
      size += 8;
      break;
    default:
      throw new Error('Unknown message type.');
  }

  return size;
};

Packet.prototype.frame = function frame() {
  var size = this.getSize();
  var bw = new StaticWriter(size + 9);
  var i, item, data;

  bw.writeU8(this.type);
  bw.writeU32(size);
  bw.writeU32(0);

  switch (this.type) {
    case Packet.types.EVENT:
      bw.writeU8(this.event.length);
      bw.writeString(this.event, 'ascii');
      bw.writeBytes(this.payload);
      break;
    case Packet.types.CALL:
      bw.writeU8(this.event.length);
      bw.writeString(this.event, 'ascii');
      bw.writeU32(this.id);
      bw.writeBytes(this.payload);
      break;
    case Packet.types.ACK:
      bw.writeU32(this.id);
      bw.writeBytes(this.payload);
      break;
    case Packet.types.ERROR:
      bw.writeU32(this.id);
      bw.writeU8(this.code);
      bw.writeU8(this.msg.length);
      bw.writeString(this.msg, 'ascii');
      break;
    case Packet.types.PING:
      bw.writeBytes(this.payload);
      break;
    case Packet.types.PONG:
      bw.writeBytes(this.payload);
      break;
    default:
      throw new Error('Unknown message type.');
  }

  data = bw.render();

  data.writeUInt32LE(crc32(data.slice(9)), 5, true);

  return data;
};

/*
 * Expose
 */

exports = Packet;
exports.Packet = Packet;
exports.Header = Header;

module.exports = exports;
