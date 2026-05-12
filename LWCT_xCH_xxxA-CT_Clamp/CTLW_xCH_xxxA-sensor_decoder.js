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

function ctLwDeviceDecode(bytes) {
  var b = bytes || [];
  if (b.length < 7) return { error: "Payload too short" };

  function parse16Bit(low, high) {
    var val = (high << 8) | low;
    return (val & 0x8000) ? val - 0x10000 : val;
  }

  var raw1 = parse16Bit(b[0], b[1]);
  var raw2 = parse16Bit(b[2], b[3]);
  var raw3 = parse16Bit(b[4], b[5]);

  return {
    ch1_amps: parseFloat((Math.abs(raw2) / 100).toFixed(2)),
    ch2_amps: parseFloat((Math.abs(raw3) / 100).toFixed(2)),
    ch3_amps: parseFloat((Math.abs(raw1) / 100).toFixed(2)),
    counter: b[6]
  };
}


