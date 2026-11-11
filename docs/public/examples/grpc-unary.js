// Reply { bool enabled = 1; } with enabled set to true.
const message = new Uint8Array([0x08, 0x01]);
const frame = new Uint8Array(5 + message.length);
// The zero-initialized first byte marks an uncompressed message.
new DataView(frame.buffer).setUint32(1, message.length);
frame.set(message, 5);
$done({ body: frame });
