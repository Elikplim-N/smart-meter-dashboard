# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development server with Turbopack (faster builds)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code (ESLint with Next.js and TypeScript rules)
npm run lint
```

Development server runs on `http://localhost:3000` by default.

## Architecture Overview

This is a **client-side Next.js 15 application** with no backend. The architecture consists of three layers:

### 1. Serial Communication Layer (`lib/webserial.ts`)
- **WebSerialManager class**: Handles ESP32 device communication via USB WebSerial API
- Connects at 115200 baud rate
- Parses incoming data in format: `DATA:V=X.XXX,I=X.XXX,P=X.XXX,THEFT=X.XX,ALERT=X,RELAY=X`
- Sends commands: `RELAY:ON` / `RELAY:OFF`
- Implements callback pattern for data/connect/disconnect events
- **StorageManager utility**: Persists alert history and device location to localStorage

### 2. Dashboard Component (`components/Dashboard.tsx`)
- Main UI component using React hooks (useState, useEffect, useRef)
- Manages device connection state and real-time metrics display
- Handles alert generation when theft probability ≥ 0.6
- Stores alerts to localStorage via StorageManager
- Relay toggle control sends commands to device
- Location tracking using browser Geolocation API
- Uses Lucide React icons for UI elements

### 3. Map Visualization (`components/MapView.tsx`)
- Leaflet.js-based interactive map with OpenStreetMap tiles
- Blue marker shows current device location (default: GCTU campus coordinates)
- Color-coded alert markers: red (theft > 0.7), orange (theft > 0.5), yellow (theft ≤ 0.5)
- Client-side only rendering (checks `isClient` state before mounting Leaflet)

### Data Flow
```
ESP32 Device (serial) 
  → WebSerialManager.readLoop() parses data 
  → onDataCallback triggers 
  → Dashboard state updates 
  → AlertLogs stored if theft alert 
  → MapView re-renders with new markers
```

## Key Design Patterns

- **Event callbacks**: WebSerialManager uses callback pattern for extensibility
- **Client-side storage**: No backend; all state persists in browser localStorage
- **Lazy Leaflet loading**: MapView dynamically imports Leaflet only on client to avoid hydration issues
- **Refs for serial state**: managerRef persists WebSerialManager instance across re-renders

## ESP32 Hardware Integration

- **Serial protocol**: Sends metrics every ~100ms from device firmware
- **Relay control**: Device responds with `OK:RELAY:ON/OFF` or `ERR:UNKNOWN_CMD`
- **Default location**: GCTU campus (5.55602°N, 0.19627°W) - update in Dashboard.tsx and webserial.ts if needed
- **Theft threshold**: Configurable in firmware (default 0.6), based on Edge Impulse ML model

## Firmware OLED Animation & Display

### Display Phases
The firmware implements UI state machine with animations via `UiPhase` enum in `firmware/smart_meter_webserial.ino`:
- **UI_BOOT**: Initial startup with animated slide-in logo + spinning dots (2s total)
- **UI_LOADING**: Data collection phase with progress bar and rotating spinner
- **UI_RUN**: Normal operation display showing metrics and theft probability bar
- **UI_ALERT**: Alert state with blinking inversion, diagonal hazard stripes, and warning triangle (3Hz blink rate)

### Animation Rendering Details

#### UI_BOOT Frame
- "SMART EMETER" logo slides in from left (6px per frame)
- Spinner dots animate below logo: `.  `, `.. `, `...`, `   `
- Rendered ~20 frames total

#### UI_LOADING Frame
- Title: "Loading model window"
- Horizontal progress bar: `(SCREEN_WIDTH - 4) * progress` pixels filled
- Rotating spinner (4-phase): vertical → right → down → left bar animation
- Current metrics displayed: V/I/P/R
- Updated every 100ms (10 FPS)

#### UI_RUN Frame
- Live metrics: V (6 chars), I (6 chars), P (6 chars), R (ON/OFF)
- THEFT probability (0.00-1.00)
- Horizontal theft bar: width scales with theft value (0→1)
- Status "OK" at bottom

#### UI_ALERT Frame (Blink at ~3Hz)
- Diagonal hazard stripe pattern (8px width, 16px spacing, animated)
- Inverted display (black bg, white text) every 160ms
- 24x24 warning triangle bitmap centered (precomputed `kAlertTri_24x24[]`)
- Text box with "THEFT DETECTED", theft probability, and power value
- High visual contrast and motion for urgent awareness

### Multi-threaded Architecture
Three FreeRTOS tasks run concurrently (core 1 pinned):
1. **taskSerial** (Priority 3): Handles incoming WebSerial commands (RELAY:ON/OFF), 5ms polling
2. **taskML** (Priority 2): Collects INA219 sensor data at `EI_CLASSIFIER_INTERVAL_MS`, fills feature buffer, runs Edge Impulse classifier every `kRawCount` samples, updates theft metric with EWMA + majority vote
3. **taskDisplay** (Priority 1): Renders OLED animations every 100ms (10 FPS), respects UI phase transitions

All tasks share state via mutex-protected `Metrics` struct (`g_last` + `g_last_mtx`)

### Theft Detection Logic
- **EWMA smoothing**: `theft_prob_ewma = 0.5 * theft_prob + 0.5 * theft_prob_ewma`
- **Majority vote**: 3-sample voting window for robustness
- **Alert threshold**: `(theft_prob_ewma >= 0.6f) OR vote_theft`
- **Label parsing**: Robust to model label variations ("theft", "tamper", "normal", "on"/"off" pairs)

### Progress Animation
- `m.progress` ranges 0.0 to 1.0 during ML feature window collection
- Updated on each sensor sample during first window only
- Transitions to `UI_ALERT` or `UI_RUN` after inference completes

## TypeScript & Linting

- **TypeScript strict mode** enabled (tsconfig.json)
- **Path alias**: `@/*` points to root directory
- **ESLint**: Uses Next.js core-web-vitals + TypeScript recommended rules
- No additional type checking tool needed (TypeScript via `tsc` handles this)

## Browser Compatibility

- WebSerial API requires HTTPS and specific browsers: Chrome/Edge/Opera 89+
- Firefox and Safari do NOT support WebSerial
- Geolocation API supported on all modern browsers
- Leaflet works on all browsers with WebGL support

## Deployment

Designed for Vercel deployment:
- Zero-config Next.js deployment
- Automatic HTTPS (required for WebSerial)
- See DEPLOYMENT.md for detailed steps
