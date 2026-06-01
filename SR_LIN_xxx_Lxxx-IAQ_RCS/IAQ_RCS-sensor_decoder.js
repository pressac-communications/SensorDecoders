/* eslint no-redeclare: "off" */
/* eslint-disable */

// ChirpStack v4 / TTN v3 formatter
function decodeUplink(input) {
  var decoded = iaqRcsDeviceDecode(input && input.bytes);
  if (decoded.error) return { errors: [decoded.error] };
  return { data: decoded };
}

// ChirpStack v3 legacy
function Decode(fPort, bytes) {
  var decoded = iaqRcsDeviceDecode(bytes);
  if (decoded.error) return {};
  return decoded;
}

// The Things Network legacy
function Decoder(bytes, port) {
  var decoded = iaqRcsDeviceDecode(bytes);
  if (decoded.error) return {};
  return decoded;
}
/* eslint-enable */

var notConnectedStr = "Not connected";

function iaqRcsDeviceDecode(bytes) {
  var b = bytes || [];
  if (b.length < 5) return { error: "Payload too short" };

  var messageTypes = {
    0x01: "Boot message",
    0x02: "Sensor data message",
    0x03: "Occupancy data message",
  };

  var vocUnits = {
    0: "TVOC μg/m3",
    1: "TVOC ppb",
    2: "VOC Index",
    3: "Reserved",
  };

  var tvocEquivalent = {
    0: "Isobutylene",
    1: "Molhave",
    2: "Ethanol",
    3: "Reserved",
  };

  var resetState = {
    1: "Power On",
    2: "Hard Reset",
    3: "Soft Reset",
    4: "Watchdog",
    5: "Brown out",
    6: "Other",
  };

  var hardwareRegion = {
    0: "EU868",
    1: "US915",
    2: "AS923",
    3: "AU915",
  };

  var data = {};
  var byte = 0;

  // Common header (all message types)
  var productIdRaw = b[byte++];
  data.productId = "0x" + productIdRaw.toString(16).toUpperCase();

  var messageTypeRev = b[byte++];
  var messageTypeValue = (messageTypeRev >> 4) & 0x0f;
  data.message = {};
  data.message.type = messageTypes[messageTypeValue];
  data.message.rev = (messageTypeRev & 0x0f);

  var batteryInfo = b[byte++];
  if (batteryInfo === 0) {
    data.batteryVoltage = "External powered";
  } else if (batteryInfo === 0xff) {
    data.batteryVoltage = "Not measured";
  } else {
    data.batteryVoltage = convertRange(batteryInfo, 1, 241, 0, 48);
  }

  // Boot message
  if (messageTypeValue === 1) {
    var firmwareVersionValue = b[byte++];
    firmwareVersionValue = (firmwareVersionValue << 8) | b[byte++];
    data.firmwareVersion = (
      ((firmwareVersionValue >> 12) & 0x0f) + '.' +
      ((firmwareVersionValue >> 8)  & 0x0f) + '.' +
      ((firmwareVersionValue >> 4)  & 0x0f) + '.' +
       (firmwareVersionValue        & 0x0f)
    );

    data.resetReason = resetState[b[byte++]];
    data.hardwareRegionSelection = hardwareRegion[b[byte++]];

    var sensorAvailableValue = b[byte++];
    data.isSensorsAvailable = {};
    data.isSensorsAvailable.temphumid   = (sensorAvailableValue & (1 << 0)) !== 0;
    data.isSensorsAvailable.tvoc        = (sensorAvailableValue & (1 << 1)) !== 0;
    data.isSensorsAvailable.co2         = (sensorAvailableValue & (1 << 2)) !== 0;
    data.isSensorsAvailable.pm          = (sensorAvailableValue & (1 << 3)) !== 0;
    data.isSensorsAvailable.lux         = (sensorAvailableValue & (1 << 4)) !== 0;
    data.isSensorsAvailable.soundLevel  = (sensorAvailableValue & (1 << 5)) !== 0;
    data.isSensorsAvailable.pir         = (sensorAvailableValue & (1 << 6)) !== 0;

    var readIntervalValue = b[byte++];
    data.readInterval = {};
    data.readInterval.configuration = (readIntervalValue & (1 << 0)) !== 0 ? 'Network' : 'Dip Switch';
    data.readInterval.unit = "Minutes";
    data.readInterval.value = ((readIntervalValue >> 1) & 0xFF);

    if (data.isSensorsAvailable.pm === true) {
      var pmMaskValue = b[byte++];
      data.particuleMatter = {};
      data.particuleMatter.isAutoCleanIntervalSet = (pmMaskValue & (1 << 0)) !== 0;
      if (data.particuleMatter.isAutoCleanIntervalSet === true) {
        data.particuleMatter.autoCleanInterval = {};
        data.particuleMatter.autoCleanInterval.value = ((pmMaskValue >> 2) & 0x07);
        data.particuleMatter.autoCleanInterval.units = "Days";
      }
    }

    if (data.isSensorsAvailable.co2 === true) {
      data.co2 = {};
      var co2FreshMaskValue = b[byte++];
      co2FreshMaskValue = (co2FreshMaskValue << 8) | b[byte++];
      data.co2.hasManualCalibrationPerformed = (co2FreshMaskValue & (1 << 15)) !== 0;
      data.co2.freshAirBackgroundLevel = {};
      data.co2.freshAirBackgroundLevel.value = (co2FreshMaskValue & 0x7FFF);
      data.co2.freshAirBackgroundLevel.units = "PPM";

      var co2IndoorMaskValue = b[byte++];
      co2IndoorMaskValue = (co2IndoorMaskValue << 8) | b[byte++];
      data.co2.isAutoCalibrationEnabled = (co2IndoorMaskValue & (1 << 15)) !== 0;
      data.co2.indoorAirBackgroundLevel = {};
      data.co2.indoorAirBackgroundLevel.value = (co2IndoorMaskValue & 0x7FFF);
      data.co2.indoorAirBackgroundLevel.units = "PPM";
    }

    if (data.isSensorsAvailable.pir === true) {
      data.pir = {};
      data.pir.AbsenceTimeOut = {};
      data.pir.AbsenceTimeOut.value = b[byte++];
      data.pir.AbsenceTimeOut.units = "Minutes";
      data.pir.RepeatedTimeOut = {};
      data.pir.RepeatedTimeOut.value = b[byte++];
      data.pir.RepeatedTimeOut.units = "Minutes";
    }

    if (data.isSensorsAvailable.temphumid === true) {
      data.temperatureOffset = {};
      var temperatureOffsetRaw = b[byte++];
      data.temperatureOffset.value = temperatureOffsetRaw;
      data.temperatureOffset.scaled = parseFloat(((0.25 * temperatureOffsetRaw) - 5).toFixed(2));
      data.temperatureOffset.units = "°C";

      data.humidityOffset = {};
      var humidityOffsetRaw = b[byte++];
      data.humidityOffset.value = humidityOffsetRaw;
      data.humidityOffset.scaled = parseFloat(((0.5 * humidityOffsetRaw) - 5).toFixed(2));
      data.humidityOffset.units = "%";
    }

    if (data.isSensorsAvailable.tvoc === true) {
      var vocMaskValue = b[byte++];
      data.voc = {};
      data.voc.Unit = vocUnits[(vocMaskValue) >> 4];
      data.voc.Equivalent = tvocEquivalent[(vocMaskValue & 0x0F)];
    }
  }

  // Sensor data message
  else if (messageTypeValue === 2) {
    data.dataAge = b[byte++];

    var sensorAvailableValue = b[byte++];
    data.isSensorsAvailable = {};
    data.isSensorsAvailable.temphumid   = (sensorAvailableValue & (1 << 0)) !== 0;
    data.isSensorsAvailable.tvoc        = (sensorAvailableValue & (1 << 1)) !== 0;
    data.isSensorsAvailable.co2         = (sensorAvailableValue & (1 << 2)) !== 0;
    data.isSensorsAvailable.pm          = (sensorAvailableValue & (1 << 3)) !== 0;
    data.isSensorsAvailable.lux         = (sensorAvailableValue & (1 << 4)) !== 0;
    data.isSensorsAvailable.soundLevel  = (sensorAvailableValue & (1 << 5)) !== 0;
    data.isSensorsAvailable.pir         = (sensorAvailableValue & (1 << 6)) !== 0;

    if (data.isSensorsAvailable.temphumid === true) {
      data.temperature = {};
      data.temperature.value = convertTemp(b[byte++]);
      data.temperature.units = "°C";
      data.humidity = {};
      data.humidity.value = convertHum(b[byte++]);
      data.humidity.units = "%";
    }

    if (data.isSensorsAvailable.pm === true) {
      var pmRaw;
      data.particulateMatter = {};
      pmRaw = b[byte++] << 8 | b[byte];
      data.particulateMatter.pm10 = convertPm((pmRaw & 0xFF80) >> 7);
      pmRaw = b[byte++] << 8 | b[byte];
      data.particulateMatter.pm4 = convertPm((pmRaw & 0x7FC0) >> 6);
      pmRaw = b[byte++] << 8 | b[byte];
      data.particulateMatter.pm2_5 = convertPm((pmRaw & 0x3FE0) >> 5);
      pmRaw = b[byte++] << 8 | b[byte++];
      data.particulateMatter.pm1_0 = convertPm((pmRaw & 0x1FF0) >> 4);
      data.particulateMatter.units = "µg/m³";
    }

    if (data.isSensorsAvailable.soundLevel === true) {
      data.soundLevel = {};
      data.soundLevel.value = convertSound(b[byte++]);
      data.soundLevel.units = "dBA";
    }

    if (data.isSensorsAvailable.lux === true) {
      data.illumination = {};
      data.illumination.value = convertLux(b[byte++] << 8 | b[byte++]);
      data.illumination.units = "lx";
    }

    if (data.isSensorsAvailable.co2 === true) {
      data.co2 = {};
      data.co2.value = convertco2(b[byte++] << 8 | b[byte++]);
      data.co2.units = "PPM";
    }

    if (data.isSensorsAvailable.tvoc === true) {
      var vocRaw = b[byte++] << 8 | b[byte++];
      data.voc = {};
      data.voc.value = convertVoc(vocRaw & 0x3FFF);
      data.voc.units = (data.voc.value === notConnectedStr) ? notConnectedStr : vocUnits[(vocRaw & 0xC000) >> 14];
    }
  }

  // Occupancy data message
  else if (messageTypeValue === 3) {
    data.dataAge = b[byte++];
    var occupancyValue = b[byte++];
    data.occupancyDetected = ((occupancyValue & 0x01) === 0) ? 'Vacant' : 'Occupied';
  }

  return data;
}


/////////////////////////////////////////////////////////////////////////////////
// Value conversion functions
/////////////////////////////////////////////////////////////////////////////////
function convertRange(num, inMin, inMax, outMin, outMax) {
  var out = outMin + ((num - inMin) / (inMax - inMin) * (outMax - outMin));
  return parseFloat(out.toFixed(2));
}

function convertTemp(num) {
  return (num === 0xFF) ? notConnectedStr : convertRange(num, 0, 240, -10, 50);
}

function convertHum(num) {
  return (num === 0xFF) ? notConnectedStr : convertRange(num, 0, 200, 0, 100);
}

function convertPm(num) {
  return (num === 0x1FF) ? notConnectedStr : num;
}

function convertSound(num) {
  return (num === 0xFF) ? notConnectedStr : convertRange(num, 0, 250, 0, 125);
}

function convertLux(num) {
  return (num === 0xFFFF) ? notConnectedStr : convertRange(num, 0, 20000, 0, 20000);
}

function convertco2(num) {
  return (num === 0xFFFF) ? notConnectedStr : convertRange(num, 0, 5000, 0, 5000);
}

function convertVoc(num) {
  return (num === 0x3FFF) ? notConnectedStr : convertRange(num, 0, 5000, 0, 5000);
}
