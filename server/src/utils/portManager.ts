import dotenv from 'dotenv';
import path from 'path';
import net from 'net';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const RESERVED_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 3389, 5432, 5900, 6379, 8080, 8443];
const COMMON_PORTS = [3000, 3001, 3002, 3030, 4000, 4200, 5000, 5173, 5174, 8000, 8081, 9000, 9090];

const PREFERRED_PORT_RANGE = {
  MIN: 27000,
  MAX: 29999
};

export interface PortCheckResult {
  available: boolean;
  port: number;
  suggestedPort?: number;
  message: string;
}

export class PortManager {
  private static usedPorts: Set<number> = new Set();

  static async checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, '127.0.0.1');
      
      setTimeout(() => {
        try {
          server.close();
        } catch {
          // Ignore errors
        }
        resolve(false);
      }, 2000);
    });
  }

  static async findAvailablePort(startPort?: number): Promise<number> {
    const start = startPort || PREFERRED_PORT_RANGE.MIN;
    
    for (let port = start; port <= PREFERRED_PORT_RANGE.MAX; port++) {
      if (this.isReserved(port)) continue;
      if (this.isCommon(port)) continue;
      if (this.usedPorts.has(port)) continue;
      
      const available = await this.checkPort(port);
      if (available) {
        this.usedPorts.add(port);
        return port;
      }
    }
    
    throw new Error('No available ports found in the preferred range');
  }

  static async validateAndGetPort(requestedPort?: number): Promise<PortCheckResult> {
    const targetPort = requestedPort || parseInt(process.env.PORT || '28443', 10);
    
    if (this.isReserved(targetPort)) {
      const suggested = await this.findAvailablePort();
      return {
        available: false,
        port: targetPort,
        suggestedPort: suggested,
        message: `Port ${targetPort} is a reserved system port`
      };
    }

    if (this.isCommon(targetPort)) {
      const suggested = await this.findAvailablePort();
      return {
        available: false,
        port: targetPort,
        suggestedPort: suggested,
        message: `Port ${targetPort} is a commonly used port, using suggested port ${suggested}`
      };
    }

    const isAvailable = await this.checkPort(targetPort);
    
    if (!isAvailable) {
      const suggested = await this.findAvailablePort();
      return {
        available: false,
        port: targetPort,
        suggestedPort: suggested,
        message: `Port ${targetPort} is already in use, suggested port: ${suggested}`
      };
    }

    this.usedPorts.add(targetPort);
    return {
      available: true,
      port: targetPort,
      message: `Port ${targetPort} is available`
    };
  }

  static isReserved(port: number): boolean {
    return RESERVED_PORTS.includes(port);
  }

  static isCommon(port: number): boolean {
    return COMMON_PORTS.includes(port);
  }

  static releasePort(port: number): void {
    this.usedPorts.delete(port);
  }

  static getUsedPorts(): number[] {
    return Array.from(this.usedPorts);
  }
}

export default PortManager;
