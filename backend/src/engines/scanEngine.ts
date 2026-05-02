import { v4 as uuidv4 } from 'uuid';

export interface ScanResult {
  trackingNumber: string;
  isValid: boolean;
  carrier?: string;
  rawData: string;
}

export class ScanEngine {
  
  static parseBarcode(barcodeData: string): ScanResult {
    const cleanedData = barcodeData.trim();
    
    if (!this.validateTrackingNumber(cleanedData)) {
      return {
        trackingNumber: cleanedData,
        isValid: false,
        rawData: barcodeData
      };
    }
    
    return {
      trackingNumber: cleanedData,
      isValid: true,
      carrier: this.detectCarrier(cleanedData),
      rawData: barcodeData
    };
  }
  
  static validateTrackingNumber(trackingNumber: string): boolean {
    if (!trackingNumber || trackingNumber.length < 8) {
      return false;
    }
    
    const patterns = [
      /^SF\d{12,15}$/,
      /^YT\d{13,16}$/,
      /^ZT\d{10,14}$/,
      /^JD\d{12,15}$/,
      /^7\d{10,15}$/,
      /^[A-Z0-9]{8,20}$/
    ];
    
    return patterns.some(pattern => pattern.test(trackingNumber.toUpperCase()));
  }
  
  static detectCarrier(trackingNumber: string): string {
    const upper = trackingNumber.toUpperCase();
    
    if (upper.startsWith('SF')) return '顺丰速运';
    if (upper.startsWith('YT')) return '圆通速递';
    if (upper.startsWith('ZT')) return '中通快递';
    if (upper.startsWith('JD')) return '京东物流';
    if (upper.startsWith('7')) return '极兔速递';
    if (upper.startsWith('EMS')) return 'EMS';
    
    return '未知快递';
  }
  
  static generateMockTrackingNumber(): string {
    const carriers = ['SF', 'YT', 'ZT', 'JD'];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const numbers = Array.from({ length: 12 }, () => 
      Math.floor(Math.random() * 10).toString()
    ).join('');
    return `${carrier}${numbers}`;
  }
  
  static simulateScan(): ScanResult {
    const trackingNumber = this.generateMockTrackingNumber();
    return this.parseBarcode(trackingNumber);
  }
}

export default ScanEngine;
