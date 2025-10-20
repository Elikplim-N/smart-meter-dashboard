// WebSerial API types
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array>;
  readable: ReadableStream<Uint8Array>;
}

export interface DeviceData {
  voltage: number;
  current: number;
  power: number;
  theft: number;
  alert: boolean;
  relay: boolean;
  timestamp: number;
}

export interface AlertLog {
  id: string;
  timestamp: number;
  voltage: number;
  current: number;
  power: number;
  theft: number;
  lat: number;
  lng: number;
}

export class WebSerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private onDataCallback: ((data: DeviceData) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      const nav = navigator as unknown as { serial: { requestPort(): Promise<SerialPort> } };
      this.port = await nav.serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      this.isConnected = true;

      const encoder = new TextEncoderStream();
      const decoder = new TextDecoderStream();
      void encoder.readable.pipeTo(this.port.writable!);
      void this.port.readable!.pipeTo(decoder.writable);

      this.reader = decoder.readable.getReader();
      this.writer = encoder.writable.getWriter();

      this.onConnectCallback?.();
      this.readLoop();
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.isConnected = false;
      if (this.reader) {
        this.reader.cancel();
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      this.onDisconnectCallback?.();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.writer) throw new Error("Not connected");
    await this.writer.write(command + "\n");
  }

  private async readLoop(): Promise<void> {
    if (!this.reader) return;

    try {
      let buffer = "";
      while (this.isConnected) {
        const { value, done } = await this.reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          this.parseLine(line.trim());
        }
      }
    } catch (error) {
      if (this.isConnected) {
        console.error("Read loop error:", error);
        this.disconnect();
      }
    }
  }

  private parseLine(line: string): void {
    if (!line) return;

    // Parse "DATA:V=X.XXX,I=X.XXX,P=X.XXX,THEFT=X.XX,ALERT=X"
    if (line.startsWith("DATA:")) {
      try {
        const dataStr = line.substring(5);
        const pairs = dataStr.split(",");
        const data: Record<string, number> = {};

        for (const pair of pairs) {
          const [key, value] = pair.split("=");
          if (key && value) {
            data[key.toLowerCase()] = parseFloat(value);
          }
        }

        if (
          data.v !== undefined &&
          data.i !== undefined &&
          data.p !== undefined
        ) {
          const deviceData: DeviceData = {
            voltage: data.v,
            current: data.i,
            power: data.p,
            theft: data.theft ?? 0,
            alert: data.alert === 1,
            relay: data.relay === 1,
            timestamp: Date.now(),
          };
          this.onDataCallback?.(deviceData);
        }
      } catch (error) {
        console.error("Failed to parse line:", line, error);
      }
    }

    // Log other messages
    if (
      line.startsWith("OK:") ||
      line.startsWith("ERR:") ||
      line.startsWith("HTTP")
    ) {
      console.log("[Device]", line);
    }
  }

  onData(callback: (data: DeviceData) => void): void {
    this.onDataCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  getConnected(): boolean {
    return this.isConnected;
  }
}

// Storage helpers
export const StorageManager = {
  saveAlerts(alerts: AlertLog[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("alertLogs", JSON.stringify(alerts));
    }
  },

  loadAlerts(): AlertLog[] {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("alertLogs");
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  saveLastLocation(lat: number, lng: number): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastLocation", JSON.stringify({ lat, lng }));
    }
  },

  loadLastLocation(): { lat: number; lng: number } {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("lastLocation");
      return data ? JSON.parse(data) : { lat: 5.55602, lng: -0.196278 }; // GCTU coords
    }
    return { lat: 5.55602, lng: -0.196278 };
  },
};
