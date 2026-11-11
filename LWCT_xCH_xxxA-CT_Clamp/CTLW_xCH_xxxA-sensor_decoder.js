/* eslint no-redeclare: "off" */
/* eslint-disable */

// ChirpStack v4 / TTN v3 formatter
function decodeUplink(input) {
  var decoded = ctLwDeviceDecode(input && input.bytes);
  if (decoded.error) return { errors: [decoded.error] };
  return { data: decoded };
}

// ChirpStack v3 
function Decode(fPort, bytes) {
  var decoded = ctLwDeviceDecode(bytes);
  if (decoded.error) return {};
  return decoded;
}

// The Things Network legacy
function Decoder(bytes, port) {
  var decoded = ctLwDeviceDecode(bytes);
  if (decoded.error) return {}; 
  return decoded;
}
/* eslint-enable */

// Uplink payload (fPort 60, 8 bytes, little-endian):
//   bytes 0-1  uint16  Channel 3 current x 100
//   bytes 2-3  uint16  Channel 1 current x 100
//   bytes 4-5  uint16  Channel 2 current x 100
//   byte  6    uint8   counter: number of 30-second periods averaged
//   byte  7    reserved, always 0

function ctLwDeviceDecode(bytes) {
  var b = bytes || [];
  if (b.length < 7) return { error: "Payload too short" };

  // Currents are unsigned.
  function parseU16LE(low, high) {
    return (high << 8) | low;
  }

  var raw1 = parseU16LE(b[0], b[1]);
  var raw2 = parseU16LE(b[2], b[3]);
  var raw3 = parseU16LE(b[4], b[5]);

  return {
    ch1_amps: parseFloat((raw2 / 100).toFixed(2)),
    ch2_amps: parseFloat((raw3 / 100).toFixed(2)),
    ch3_amps: parseFloat((raw1 / 100).toFixed(2)),
    counter: b[6]
  };
}



