# CTLW xCH xxxA Sensor Decoder

Payload codec for **CTLW_xCH_xxxA_Lxxx** LoRaWAN messages.

|        CTLW_1CH_xxxA_Lxxx       |         CTLW_3CH_xxxA_Lxxx         |
| :-----------------------------: | :--------------------------------: |
| ![CTLW_1CH_xxxA_Lxxx ](CTLW_1CH_xxxA_Lxxx.png) | ![CTLW_1CH_xxxA_Lxxx ](CTLW_3CH_xxxA_Lxxx.png) |


## 🌐 1 - Supported Platforms

This project includes catch-all wrappers for the following network server formats:

- ChirpStack v4 / TTN v3 formatter: `decodeUplink(input)`
- ChirpStack v3 legacy: `Decode(fPort, bytes)`
- The Things Network legacy: `Decoder(bytes, port)`

## 📂 2 - Files

- `CTLW_xCH_xxxA-sensor_decoder.js`
  - Shared decode core + all platform wrapper functions.


### Data payload format

|      CHANNEL      | LENGTH | DESCRIPTION                                                          |
| :---------------: | :----: | -------------------------------------------------------------------- |
|    ch1 amps       |    2   | Average RMS current flowing through the conductor monitored by CT Clamp Channel 1. <br/> unit: A, read: uint16 / divisor     |
|    ch2 amps       |    2   | Average RMS current flowing through the conductor monitored by CT Clamp Channel 2. <br/> unit: A, read: uint16 / divisor     |
|    ch3 amps       |    2   | Average RMS current flowing through the conductor monitored by CT Clamp Channel 3. <br/> unit: A, read: uint16 / divisor     |
|    counter        |    1   | Indicates how many 30‑second measurement periods are represented by the reported current values. The current measurements are averaged across all included periods, allowing extended reporting intervals and unacknowledged transmissions to be represented in a single message. <br/> read: uint8                 |


## 📄 3 - Example Decoder Output Format

Example decoded object:

```json
//Device 1, fPort:60, data:AAAAABYEAQA=
{
  "ch1_amps":0,
  "ch2_amps":10.46,
  "ch3_amps":0,
  "counter":1
}
```

## 📝 4 - Notes

- Decoder includes payload-length checks to prevent invalid decoding on short payloads.
