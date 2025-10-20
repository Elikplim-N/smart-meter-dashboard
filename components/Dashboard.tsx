'use client';

import { useState, useEffect, useRef } from 'react';
import {
  WebSerialManager,
  DeviceData,
  StorageManager,
  AlertLog,
} from '@/lib/webserial';
import MapView from './MapView';
import {
  Zap,
  Wifi,
  WifiOff,
  AlertTriangle,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react';

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<DeviceData | null>(null);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [location, setLocation] = useState({ lat: 5.55602, lng: -0.196278 });
  const [relayOn, setRelayOn] = useState(false);
  const managerRef = useRef<WebSerialManager | null>(null);

  useEffect(() => {
    // Load persisted data
    const savedAlerts = StorageManager.loadAlerts();
    const savedLocation = StorageManager.loadLastLocation();
    setAlerts(savedAlerts);
    setLocation(savedLocation);
  }, []);

  const handleConnect = async () => {
    try {
      if (!managerRef.current) {
        managerRef.current = new WebSerialManager();

        managerRef.current.onData((deviceData) => {
          setData(deviceData);
          setRelayOn(deviceData.relay);

          // Log alerts
          if (deviceData.alert) {
            const newAlert: AlertLog = {
              id: Date.now().toString(),
              timestamp: deviceData.timestamp,
              voltage: deviceData.voltage,
              current: deviceData.current,
              power: deviceData.power,
              theft: deviceData.theft,
              lat: location.lat,
              lng: location.lng,
            };

            setAlerts((prev) => {
              const updated = [...prev, newAlert];
              StorageManager.saveAlerts(updated);
              return updated;
            });
          }
        });

        managerRef.current.onConnect(() => {
          setConnected(true);
        });

        managerRef.current.onDisconnect(() => {
          setConnected(false);
        });
      }

      await managerRef.current.connect();
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect. Make sure your device is plugged in.');
    }
  };

  const handleDisconnect = async () => {
    if (managerRef.current) {
      await managerRef.current.disconnect();
    }
  };

  const handleRelayToggle = async () => {
    if (!managerRef.current) return;
    try {
      const command = relayOn ? 'RELAY:OFF' : 'RELAY:ON';
      await managerRef.current.sendCommand(command);
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    StorageManager.saveAlerts([]);
  };

  const handleUpdateLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLoc);
        StorageManager.saveLastLocation(newLoc.lat, newLoc.lng);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Smart Meter Dashboard</h1>
          <div className="flex gap-3">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
              >
                <WifiOff size={20} />
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
              >
                <Wifi size={20} />
                Connect Device
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`p-4 rounded-lg text-center font-semibold text-lg transition ${
            connected
              ? 'bg-green-900 text-green-200 border border-green-700'
              : 'bg-gray-700 text-gray-300 border border-gray-600'
          }`}
        >
          {connected ? '✓ Device Connected' : '✗ Disconnected'}
        </div>

        {connected && data ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Voltage */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-gray-400 text-sm mb-2">Voltage</p>
                <p className="text-3xl font-bold">{data.voltage.toFixed(1)}V</p>
              </div>

              {/* Current */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-gray-400 text-sm mb-2">Current</p>
                <p className="text-3xl font-bold">{data.current.toFixed(3)}A</p>
              </div>

              {/* Power */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-gray-400 text-sm mb-2">Power</p>
                <p className="text-3xl font-bold">{data.power.toFixed(1)}W</p>
              </div>

              {/* Theft Detection */}
              <div
                className={`rounded-lg p-6 border ${
                  data.alert
                    ? 'bg-red-900 border-red-700'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <p className="text-gray-300 text-sm mb-2">Theft Risk</p>
                <p
                  className={`text-3xl font-bold ${
                    data.alert ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {data.theft.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Alert & Relay Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alert Status */}
              <div
                className={`rounded-lg p-6 border flex items-center gap-4 ${
                  data.alert
                    ? 'bg-red-900 border-red-700'
                    : 'bg-green-900 border-green-700'
                }`}
              >
                {data.alert ? (
                  <AlertTriangle size={32} className="text-red-400" />
                ) : (
                  <Zap size={32} className="text-green-400" />
                )}
                <div>
                  <p className="text-sm text-gray-300">Status</p>
                  <p className="text-xl font-bold">
                    {data.alert ? '⚠ ALERT' : '✓ Normal'}
                  </p>
                </div>
              </div>

              {/* Relay Control */}
              <button
                onClick={handleRelayToggle}
                className={`rounded-lg p-6 border flex items-center justify-between transition ${
                  relayOn
                    ? 'bg-blue-900 border-blue-700 hover:bg-blue-800'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div>
                  <p className="text-sm text-gray-300 text-left">Relay</p>
                  <p className="text-xl font-bold text-left">
                    {relayOn ? 'ON' : 'OFF'}
                  </p>
                </div>
                {relayOn ? (
                  <Power size={32} className="text-blue-400" />
                ) : (
                  <PowerOff size={32} className="text-gray-400" />
                )}
              </button>
            </div>

            {/* Map */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Alert Locations</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateLocation}
                    className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition"
                  >
                    Update Location
                  </button>
                  {alerts.length > 0 && (
                    <button
                      onClick={handleClearAlerts}
                      className="text-xs bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <MapView
                alerts={alerts}
                currentLat={location.lat}
                currentLng={location.lng}
              />
            </div>

            {/* Alert Logs Table */}
            {alerts.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 overflow-x-auto">
                <h2 className="text-xl font-bold mb-4">Alert History</h2>
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="text-left py-2">Time</th>
                      <th className="text-left py-2">Theft</th>
                      <th className="text-left py-2">Voltage</th>
                      <th className="text-left py-2">Current</th>
                      <th className="text-left py-2">Power</th>
                      <th className="text-left py-2">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {alerts.slice().reverse().map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-600">
                        <td className="py-2">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2">{alert.theft.toFixed(2)}</td>
                        <td className="py-2">{alert.voltage.toFixed(1)}V</td>
                        <td className="py-2">{alert.current.toFixed(3)}A</td>
                        <td className="py-2">{alert.power.toFixed(1)}W</td>
                        <td className="py-2">
                          {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-700 rounded-lg p-12 border border-gray-600 text-center">
            <Wifi size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-xl text-gray-400">
              {connected
                ? 'Waiting for device data...'
                : 'Click "Connect Device" to start'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
