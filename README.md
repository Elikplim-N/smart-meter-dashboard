# Smart Meter Dashboard

A real-time WebSerial dashboard for ESP32-based smart meter monitoring with theft detection, location tracking, and alert logging.

## Features

- **Real-time Metrics**: Display voltage, current, power, and theft probability
- **Theft Detection**: ML-powered anomaly detection via Edge Impulse
- **Interactive Map**: Leaflet-based map showing alert locations (GCTU campus centered)
- **Alert Logging**: Complete history of alerts with timestamps and coordinates
- **Relay Control**: Remote control of relay via serial commands
- **Location Tracking**: GPS/Geolocation integration for alert mapping
- **Dark Mode Dashboard**: Modern, responsive UI with Tailwind CSS
- **Data Persistence**: Local storage of alerts and location data

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Maps**: Leaflet.js + OpenStreetMap
- **Hardware**: ESP32 + INA219 + Adafruit OLED
- **ML**: Edge Impulse TinyML
- **Deployment**: Vercel

## Prerequisites

### Hardware
- ESP32 development board
- INA219 current sensor
- Adafruit SSD1306 OLED display (128x64)
- Relay module
- LED (status indicator)

### Software
- Node.js 18+
- Arduino IDE / PlatformIO
- Modern browser with WebSerial support (Chrome, Edge, Opera)

## Local Development

### Setup

```bash
cd smart-meter-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Device Connection

1. Connect ESP32 via USB
2. Click "Connect Device" button
3. Select your device from the serial port list
4. Dashboard will display real-time metrics

## ESP32 Firmware

The modified firmware (`firmware/smart_meter_webserial.ino`) removes Firebase integration and outputs data via USB Serial in the format:

```
DATA:V=230.150,I=0.452,P=104.170,THEFT=0.15,ALERT=0,RELAY=1
```

### Required Libraries

- TinyML Edge Impulse model headers
- Adafruit INA219
- Adafruit GFX
- Adafruit SSD1306
- FreeRTOS (ESP32 core)

### Serial Commands

The device accepts these commands via WebSerial:

```
RELAY:ON   - Turn on the relay
RELAY:OFF  - Turn off the relay
```

Responses:
- `OK:RELAY:ON` / `OK:RELAY:OFF` - Command success
- `ERR:UNKNOWN_CMD` - Invalid command

## Dashboard Usage

### Metrics Display
- **Voltage**: Current bus voltage reading
- **Current**: Current draw in amperes
- **Power**: Calculated power consumption (V × I)
- **Theft Risk**: ML-derived probability of anomaly (0.0-1.0)

### Controls

- **Connect Device**: Establish WebSerial connection
- **Relay Toggle**: Switch relay ON/OFF (colored blue when active)
- **Update Location**: Use geolocation API to update device location
- **Clear Alerts**: Reset alert history

### Alert Management

Alerts trigger when theft probability ≥ 0.6. Each alert logs:
- Timestamp
- Voltage/Current/Power
- Theft probability
- GPS coordinates
- Displayed on interactive map

## Data Persistence

All data stored locally in browser:
- `alertLogs`: Complete alert history (localStorage)
- `lastLocation`: Most recent device location (localStorage)

Data persists across browser sessions.

## Deployment to Vercel

### Prerequisites
- Vercel account
- GitHub repository

### Steps

1. Push project to GitHub:
```bash
git remote add origin https://github.com/your-username/smart-meter-dashboard
git push -u origin main
```

2. Connect to Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import GitHub repository
   - Framework: Next.js
   - Deploy

3. Dashboard available at: `https://your-project.vercel.app`

## Environment Setup

### For GCTU (Ghana)

Default coordinates: **5.55602°N, 0.19627°W** (GCTU main campus)

Change in `components/Dashboard.tsx` and `lib/webserial.ts`:
```typescript
const defaultLocation = { lat: 5.55602, lng: -0.196278 };
```

## Browser Compatibility

| Browser | WebSerial Support |
|---------|-------------------|
| Chrome  | ✓ Full support    |
| Edge    | ✓ Full support    |
| Opera   | ✓ Full support    |
| Firefox | ✗ Not supported   |
| Safari  | ✗ Not supported   |

## API Endpoints

This is a client-side only application. No backend API required. All data:
- Streamed via WebSerial from device
- Stored locally in browser
- Processed client-side

## Troubleshooting

### Device Won't Connect
- Ensure USB drivers installed (CH340 or CP2102)
- Check browser console for errors
- Try different USB port
- Verify firmware uploaded correctly

### No Data Received
- Check ESP32 is running and OLED displays metrics
- Verify baud rate (115200)
- Check serial output with Arduino IDE Serial Monitor

### Map Not Displaying
- Verify internet connection (needs OpenStreetMap tiles)
- Check browser console for Leaflet errors
- Enable geolocation permission

## Configuration

### Modify Theft Detection Threshold

In `firmware/smart_meter_webserial.ino`:
```cpp
bool alert=ewma>=0.6f;  // Change 0.6 to desired threshold
```

### Adjust EWMA Smoothing

```cpp
ewma=0.5*theft_prob+0.5*ewma;  // 0.5 = smoothing factor (0.0-1.0)
```

### Change Relay Pins

```cpp
static constexpr int RELAY_PIN = 16;  // Change GPIO pin number
```

## License

MIT

## Support

For issues or questions:
- Check firmware serial output
- Review browser console logs
- Verify hardware connections
- Test with Arduino Serial Monitor

---

**Ready to deploy!** Push to GitHub and connect to Vercel for instant deployment.
