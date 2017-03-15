'use strict';

var TABLE;

function createTable() {
  var tbl = new Int32Array(256);
  var i, j, n;

  for (i = 0; i < 256; i++) {
    n = i;
    for (j = 0; j < 8; j++) {
      if (n & 1)
        n = (n >>> 1) ^ 0xedb88320;
      else
        n >>>= 1;
    }
    tbl[i] = n;
  }

  return tbl;
}

function crc32(data) {
  var hash = 0xffffffff;
  var trailing = data.length % 4;
  var len = data.length - trailing;
  var T = TABLE;
  var i = 0;

  while (i < len) {
    hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
    hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
    hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
    hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
  }

  switch (trailing) {
    case 3:
      hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
    case 2:
      hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
    case 1:
      hash = (hash >>> 8) ^ T[(hash ^ data[i++]) & 0xff];
  }

  hash ^= 0xffffffff;

  return hash >>> 0;
}

TABLE = createTable();

/*
 * Expose
 */

module.exports = crc32;
