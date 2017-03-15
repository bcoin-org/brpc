# BRPC

A binary-only RPC protocol for websockets (think socket.io, only faster).

## Usage

``` js
var http = require('http');
var brpc = require('brpc');
var rpc = brpc.createServer();
var server = http.createServer();
var socket;

rpc.attach(server);

rpc.on('socket', function(socket) {
  socket.hook('foo', function(data) {
    var result = new Buffer('bar');
    return Promise.resolve(result);
  });
  socket.listen('bar', function(data) {
    console.log('Received bar: ', data);
  });
});

server.listen(8000);

socket = brpc.connect(8000);

socket.on('open', function() {
  console.log('Calling foo...');
  socket.call('foo').then(function(data) {
    console.log('Response for foo: ', data);
  });
  console.log('Sending bar...');
  socket.fire('bar', new Buffer('baz'));
});
```

## Why?

Most websocket-based protocols use JSON. JSON is big and slow. In many cases
when needing to send binary data over a convential websocket protocol, the
programmer is forced to use hex strings inside of the JSON serialization. This
is inefficient.

Furthermore, most event-based abstractions on top of websockets introduce an
enormous amount of bloat due to the inclusion of fallback transports (xhr,
longpolling, etc) as well as even higher level abstractions (channels).

BRPC works only with binary data and gives you a simple event based interface
without anything else. No channels, no fallback, no complicated handshakes or
feature testing over HTTP.

## Specification

See `spec.md`.

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

- Copyright (c) 2017, Christopher Jeffrey (MIT License).

See LICENSE for more info.
