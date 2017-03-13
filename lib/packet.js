'use strict';

var encoding = require('./encoding');
var BufferReader = require('./reader');
var StaticWriter = require('./writer');

/**
 * Packet
 * @constructor
 */

function Packet() {
  this.type = 0;
  this.id = 0;
  this.event = '';
  this.payload = [];
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

Packet.prototype.fromRaw = function fromRaw(data, noSize) {
  var br = new BufferReader(data);
  var size = -1;
  var type = -1;
  var id = -1;
  var event = null;
  var payload = [];
  var code = 0;
  var msg = '';
  var i, count, item;

  if (!noSize) {
    size = br.readU32();
    if (size !== data.length - 5)
      throw new Error('Bad packet size.');
  }

  type = br.readU8();

  switch (type) {
    case Packet.types.EVENT:
      size = br.readU8();
      event = br.readString('ascii', size);
      count = br.readU8();
      for (i = 0; i < count; i++) {
        size = br.readVarint();
        item = br.readBytes(size);
        payload.push(item);
      }
      break;
    case Packet.types.CALL:
      size = br.readU8();
      event = br.readString('ascii', size);
      id = br.readU32();
      count = br.readU8();
      for (i = 0; i < count; i++) {
        size = br.readVarint();
        item = br.readBytes(size);
        payload.push(item);
      }
      break;
    case Packet.types.ACK:
      id = br.readU32();
      count = br.readU8();
      for (i = 0; i < count; i++) {
        size = br.readVarint();
        item = br.readBytes(size);
        payload.push(item);
      }
      break;
    case Packet.types.ERROR:
      id = br.readU32();
      code = br.readU8();
      size = br.readU8();
      msg = br.readString('ascii', size);
      break;
    case Packet.types.PING:
      payload = [br.readBytes(8)];
      break;
    case Packet.types.PONG:
      payload = [br.readBytes(8)];
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

Packet.fromRaw = function fromRaw(data, noSize) {
  return new Packet().fromRaw(data, noSize);
};

Packet.prototype.getSize = function getSize() {
  var size = 0;
  var i, item;

  size += 4;
  size += 1;

  switch (this.type) {
    case Packet.types.EVENT:
      size += 1;
      size += this.event.length;
      size += 1;
      for (i = 0; i < this.payload.length; i++) {
        item = this.payload[i];
        size += encoding.sizeVarint(item.length);
        size += item.length;
      }
      break;
    case Packet.types.CALL:
      size += 1;
      size += this.event.length;
      size += 4;
      size += 1;
      for (i = 0; i < this.payload.length; i++) {
        item = this.payload[i];
        size += encoding.sizeVarint(item.length);
        size += item.length;
      }
      break;
    case Packet.types.ACK:
      size += 4;
      size += 1;
      for (i = 0; i < this.payload.length; i++) {
        item = this.payload[i];
        size += encoding.sizeVarint(item.length);
        size += item.length;
      }
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

Packet.prototype.toRaw = function toRaw() {
  var size = this.getSize();
  var bw = new StaticWriter(size);
  var i, item;

  bw.writeU32(size - 5);
  bw.writeU8(this.type);

  switch (this.type) {
    case Packet.types.EVENT:
      bw.writeU8(this.event.length);
      bw.writeString(this.event, 'ascii');
      bw.writeU8(this.payload.length);
      for (i = 0; i < this.payload.length; i++) {
        item = this.payload[i];
        bw.writeVarint(item.length);
        bw.writeBytes(item);
      }
      break;
    case Packet.types.CALL:
      bw.writeU8(this.event.length);
      bw.writeString(this.event, 'ascii');
      bw.writeU32(this.id);
      bw.writeU8(this.payload.length);
      for (i = 0; i < this.payload.length; i++) {
        item = this.payload[i];
        bw.writeVarint(item.length);
        bw.writeBytes(item);
      }
      break;
    case Packet.types.ACK:
      bw.writeU32(this.id);
      bw.writeU8(this.payload.length);
      for (i = 0; i < this.payload.length; i++) {
        item = this.payload[i];
        bw.writeVarint(item.length);
        bw.writeBytes(item);
      }
      break;
    case Packet.types.ERROR:
      bw.writeU32(this.id);
      bw.writeU8(this.code);
      bw.writeU8(this.msg.length);
      bw.writeString(this.msg, 'ascii');
      break;
    case Packet.types.PING:
      bw.writeBytes(this.payload[0]);
      break;
    case Packet.types.PONG:
      bw.writeBytes(this.payload[0]);
      break;
    default:
      throw new Error('Unknown message type.');
  }

  return bw.render();
};

/*
 * Expose
 */

module.exports = Packet;
