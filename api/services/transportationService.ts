import { v4 as uuidv4 } from 'uuid';
import { mockParkingLots, mockViolations } from '../data/mockData';
import type { ParkingLot, TrafficViolation } from '../../shared/types';

export class TransportationService {
  async generateBRTQRCode(userId: string): Promise<{ qrCode: string; expiresAt: number }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = Date.now();
    const expiresAt = now + 60 * 1000;
    const data = JSON.stringify({
      userId,
      type: 'BRT_PASS',
      issuedAt: now,
      expiresAt,
    });
    const qrCode = Buffer.from(data).toString('base64');
    return { qrCode, expiresAt };
  }

  async getNearbyParking(lat: number, lng: number, radius: number = 2000): Promise<ParkingLot[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockParkingLots.map(lot => ({
      ...lot,
      distance: this.calculateDistance(lat, lng, lot.lat, lot.lng),
    })).filter(lot => (lot.distance || 0) <= radius / 1000).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  async getTrafficViolations(userId: string, plateNumber?: string): Promise<TrafficViolation[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (plateNumber) {
      return mockViolations.filter(v => v.plateNumber === plateNumber);
    }
    return mockViolations;
  }

  async payViolation(violationId: string): Promise<{ success: boolean; transactionId: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const violation = mockViolations.find(v => v.id === violationId);
    if (!violation || violation.status !== 'unpaid') {
      return { success: false, transactionId: '' };
    }
    violation.status = 'paid';
    return {
      success: true,
      transactionId: uuidv4(),
    };
  }

  async getBusRealTime(routeId: string): Promise<{ buses: Array<{ busId: string; lat: number; lng: number; nextStop: string }> }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      buses: [
        { busId: 'B001', lat: 22.8200, lng: 108.3500, nextStop: '滨湖路口' },
        { busId: 'B002', lat: 22.8250, lng: 108.3600, nextStop: '民族广场' },
        { busId: 'B003', lat: 22.8150, lng: 108.3400, nextStop: '朝阳广场' },
      ],
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

export const transportationService = new TransportationService();
