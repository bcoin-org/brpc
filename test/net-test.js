'use strict';

var net = require('net');
var brpc = require('../');
var rpc = brpc.tcp.createServer();
var server = net.createServer();
var socket;

function timeout(ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, ms);
  });
}

rpc.attach(server);

rpc.on('socket', function(socket) {
  socket.hook('foo', async function(items) {
    var result = new Buffer('test', 'ascii');
    await timeout(3000);
    return [result];
  });
  socket.hook('error', function(items) {
    return Promise.reject(new Error('Bad call.'));
  });
  socket.listen('bar', function(items) {
    console.log('Received bar: ', items);
  });
});

server.listen(8000);

socket = brpc.tcp.connect(8000);

socket.on('open', function() {
  console.log('Calling foo...');
  socket.call('foo', []).then(function(items) {
    console.log('Response for foo: ', items);
  });
  console.log('Sending bar...');
  socket.fire('bar', [new Buffer('baz')]);
  console.log('Sending error...');
  socket.call('error', []).catch(function(err) {
    console.log('Response for error: ', err.message);
  });
});
