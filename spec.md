# BRPC Specification

The BRPC protocol is a _simple_ RPC protocol designed to be used over some form
of bidirectional communication (e.g. tcp sockets or web sockets).

## Message Serialization

### Message Types

``` c
enum {
  EVENT = 0,
  CALL = 1,
  ACK = 2,
  ERROR = 3,
  PING = 4,
  PONG = 5
};
```

Communication is split into 4 different messages:

- EVENT (0)
- CALL (1)
- ACK (2)
- ERROR (3)
- PING (4)
- PONG (5)

Each message is serialized with a header, body, and payload. Note that all
integers are to be serialized as little-endian.

### Message Header

Serialization:

``` c
typedef struct {
  uint8_t type;
  uint32_t size;
  uint32_t checksum;
} packet_header_t;
```

Every BRPC message consists of a 9 byte header which includes the message type,
the body size (not including the 9 byte header itself), as well as a 32 bit crc.

There is no BRPC handshake, as the client and server both know to wait for a 9
byte header. If the message `type` is undefined, the client SHOULD treat the
remote node as misbehaving and disconnect.

If the message payload itself does not match the message header size. The
client SHOULD disconnect from the remote node.

If the message size exceeds 10,000,000 bytes, the client SHOULD treat the
remote node as misbehaving and disconnect.

### Message Payloads

Serialization:

``` c
typedef struct {
  varint_t item_size;
  char payload_item[item_size];
} payload_item_t;
```

Payloads are a collection of varint-prefixed byte arrays, using bitcoin varint
encoding (otherwise known as "compact sizes"). These are _not_ base128 varints.

## Messages

### `EVENT` packet

``` c
typedef struct {
  packet_header_t header;
  uint8_t event_str_size;
  char event[event_str_size];
  uint8_t payload_item_count;
  payload_item_t payload[payload_item_count];
} event_packet_t;
```

The EVENT message (`packet_type = 0`) is sent to a remote node without any
expectation of a response. Event names are serialized as strings within the
message itself, prefixed by a 1 byte size. If an unknown event is received, the
client SHOULD ignore the message without disconnecting.

### `CALL` packet

``` c
typedef struct {
  packet_header_t header;
  uint8_t method_str_size;
  char method[method_str_size];
  uint32_t id;
  uint8_t payload_item_count;
  payload_item_t payload[payload_item_count];
} call_packet_t;
```

The CALL message (`packet_type = 1`) is similar to the EVENT message with one
difference: it expects a response in a reasonable amount of time, in the form
of an ACK message. Each CALL message includes a 4 byte `id`, which will be used
to correlate an incoming ACK message. If no ACK with a corresponding `id` is
received within a preset timeout, the client SHOULD ignore any future ACKs.

### `ACK` packet

``` c
typedef struct {
  packet_header_t header;
  uint32_t id;
  uint8_t payload_item_count;
  payload_item_t payload[payload_item_count];
} ack_packet_t;
```

The ACK message (`packet_type = 2`) is sent in response to a CALL message in
the event of a successful call. The payload represents the result of the call.
The corresponding CALL `id` field must be reserialized in the ACK message.

If an ACK message is received without a corresponding `id` internally, the
receiving node SHOULD ignore the message without disconnection.

### `ERROR` packet

``` c
typedef struct {
  packet_header_t header;
  uint32_t id;
  uint8_t code;
  uint8_t msg_size;
  char msg[msg_size];
} error_packet_t;
```

The ERROR message (`packet_type = 3`) is sent in response to a CALL message in
the event of a unsuccessful call. The body includes the corresponding CALL `id`
as well as an error `code` and `msg` string. The `code` shall be interpreted by
the client.

If an ERROR message is received without a corresponding `id` internally, the
receiving node SHOULD ignore the message without disconnection.

### `PING` packet

``` c
typedef struct {
  packet_header_t header;
  uint64_t challenge;
} ping_packet_t;
```

The PING message (`packet_type = 4`) is used for connection keep alive and
stall recognition. Each PING is serialized with an 8 byte nonce. This nonce is
to be sent back in a corresponding PONG message.

If a corresponding PONG is not received within 30 seconds, the sending client
SHOULD invoke stall behavior.

### `PONG` packet

``` c
typedef struct {
  packet_header_t header;
  uint64_t challenge;
} pong_packet_t;
```

The PONG message (`packet_type = 5`) is sent in response to a PING message. It
includes the same 8 byte nonce from the originating PING message.

## Stall Behavior and Misbehavior

TODO

## Initial Handshake

TODO

## BRPC over TCP sockets

TODO

## BRPC over WebSockets

TODO

## License

Copyright (c) 2017, Christopher Jeffrey. (MIT License)
