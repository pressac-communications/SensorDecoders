# IAQ / RCS Sensor Decoder

Payload codec for **IAQ** (Indoor Air Quality) and **RCS** (Room Conditions Sensor) LoRaWAN messages.

|        SR_LIN_IAQ_Lxxx          |         SR_LIN_RCS_Lxxx            |
| :-----------------------------: | :--------------------------------: |
| ![SR_LIN_IAQ_Lxxx ](SR_LIN_IAQ_Lxxx.png) | ![SR_LIN_RCS_Lxxx ](SR_LIN_RCS_Lxxx.png) |


## 🌐 1 - Supported Platforms

This project includes catch-all wrappers for the following network server formats:

- ChirpStack v4 / TTN v3 formatter: `decodeUplink(input)`
- ChirpStack v3 legacy: `Decode(fPort, bytes)`
- The Things Network legacy: `Decoder(bytes, port)`

## 📂 2 - Files

- `IAQ_RCS-sensor_decoder.js`
  - Shared decode core + all platform wrapper functions.

## 📦 3 - Message Types

The decoder handles three message types, identified by the upper nibble of byte 1:

| VALUE | MESSAGE TYPE           |
| :---: | ---------------------- |
| 0x01  | Boot message           |
| 0x02  | Sensor data message    |
| 0x03  | Occupancy data message |

---

### Common Header (all message types)

| BYTE | FIELD            | DESCRIPTION                                                          |
| :--: | ---------------- | -------------------------------------------------------------------- |
|  0   | productId        | Product identifier                                                   |
|  1   | messageTypeRev   | Bits 7–4: message type, Bits 3–0: message revision                  |
|  2   | batteryInfo      | `0x00` = External powered, `0xFF` = Not measured, else voltage in 0.2 V steps (0–48 V range) |

---

### Boot Message (type 0x01)

| BYTES  | FIELD                  | DESCRIPTION                                                  |
| :----: | ---------------------- | ------------------------------------------------------------ |
|  3–4   | firmwareVersion        | 4-nibble version string, e.g. `1.2.3.4`                     |
|   5    | resetReason            | Power On / Hard Reset / Soft Reset / Watchdog / Brown out / Other |
|   6    | hardwareRegionSelection| EU868 / US915 / AS923 / AU915                               |
|   7    | sensorAvailable        | Bitfield: bit0=temphumid, bit1=tvoc, bit2=co2, bit3=pm, bit4=lux, bit5=soundLevel, bit6=pir |
|   8    | readInterval           | Bit0: Network/Dip Switch config; bits 7–1: interval in minutes |
|   9    | pmMask *(if pm)*       | Auto-clean interval flag and period (Days)                   |
| 10–13  | co2Config *(if co2)*   | Fresh-air and indoor background levels (PPM), calibration flags |
| 14–15  | pirConfig *(if pir)*   | Absence timeout and repeated timeout (Minutes)               |
| 16–17  | temphumidOffset *(if temphumid)* | Temperature and humidity calibration offsets        |
|  18    | vocConfig *(if tvoc)*  | VOC unit and equivalent reference                            |

---

### Sensor Data Message (type 0x02)

| BYTES  | FIELD              | DESCRIPTION                                                  |
| :----: | ------------------ | ------------------------------------------------------------ |
|   3    | dataAge            | Age of the reading in seconds                                |
|   4    | sensorAvailable    | Bitfield — same encoding as boot message byte 7             |
|   5    | temperature *(if temphumid)* | `uint8`, range –10 to 50 °C                        |
|   6    | humidity *(if temphumid)*    | `uint8`, range 0–100 %                             |
|  7–10  | particulateMatter *(if pm)*  | PM10, PM4, PM2.5, PM1.0 packed as 9-bit fields, µg/m³ |
|  11    | soundLevel *(if soundLevel)* | `uint8`, range 0–125 dBA                          |
| 12–13  | illumination *(if lux)*      | `uint16`, range 0–20 000 lx                       |
| 14–15  | co2 *(if co2)*               | `uint16`, range 0–5 000 PPM                       |
| 16–17  | voc *(if tvoc)*              | 14-bit value (0–5 000); upper 2 bits encode unit  |

---

### Occupancy Data Message (type 0x03)

| BYTE | FIELD             | DESCRIPTION                    |
| :--: | ----------------- | ------------------------------ |
|  3   | dataAge           | Age of the reading in seconds  |
|  4   | occupancyDetected | `0x00` = Vacant, `0x01` = Occupied |

---

## 📄 4 - Example Decoder Output Format

### Sensor data message — all sensors present

```json
{
  "productId": "0x05",
  "message": { "type": "Sensor data message", "rev": 0 },
  "batteryVoltage": 3.8,
  "dataAge": 0,
  "isSensorsAvailable": {
    "temphumid": true,
    "tvoc": true,
    "co2": true,
    "pm": true,
    "lux": true,
    "soundLevel": true,
    "pir": false
  },
  "temperature": { "value": 22.5, "units": "°C" },
  "humidity": { "value": 45.0, "units": "%" },
  "particulateMatter": {
    "pm10": 8,
    "pm4": 6,
    "pm2_5": 4,
    "pm1_0": 2,
    "units": "µg/m³"
  },
  "soundLevel": { "value": 42.5, "units": "dBA" },
  "illumination": { "value": 350, "units": "lx" },
  "co2": { "value": 520, "units": "PPM" },
  "voc": { "value": 105, "units": "TVOC ppb" }
}
```

### Occupancy data message

```json
{
  "productId": "0x05",
  "message": { "type": "Occupancy data message", "rev": 0 },
  "batteryVoltage": 3.8,
  "dataAge": 0,
  "occupancyDetected": "Occupied"
}
```

## 📝 5 - Notes

- Decoder includes a payload-length check (minimum 5 bytes) to prevent invalid decoding on short payloads.
- All sensor fields are conditional — only present when the corresponding `isSensorsAvailable` flag is `true`.
- Sensor values of `0xFF` / `0xFFFF` / `0x1FF` / `0x3FFF` are decoded as `"Not connected"`.
- Battery voltage is encoded in 0.2 V steps; `0x00` indicates external power and `0xFF` indicates the voltage was not measured.
