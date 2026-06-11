import type { TollResult, GantryPoint, FittedPath } from '../types';

export class TollEngine {
  private baseRates: Record<number, number> = {
    1: 0.45,
    2: 0.675,
    3: 0.90,
    4: 1.125,
    5: 0.90,
    6: 1.35,
  };

  private discountRules = {
    '95折': 0.95,
    '85折': 0.85,
    '无折扣': 1.0,
  };

  private holidays: { name: string; start: string; end: string }[] = [
    { name: '春节', start: '2026-02-16', end: '2026-02-23' },
    { name: '清明节', start: '2026-04-04', end: '2026-04-07' },
    { name: '劳动节', start: '2026-05-01', end: '2026-05-06' },
    { name: '国庆节', start: '2026-10-01', end: '2026-10-08' },
  ];

  calculateToll(
    distance: number,
    vehicleType: number,
    cardType: '记账卡' | '储值卡',
    travelDate: Date
  ): TollResult {
    const result: TollResult = {
      baseFee: 0,
      discount: 1.0,
      discountFee: 0,
      actualFee: 0,
      isHolidayFree: false,
      holidayName: null,
    };

    const holiday = this.checkHolidayFree(travelDate);
    if (holiday) {
      result.isHolidayFree = true;
      result.holidayName = holiday.name;
      result.baseFee = Math.round(distance * (this.baseRates[vehicleType] || this.baseRates[1]) * 100) / 100;
      result.actualFee = 0;
      result.discountFee = result.baseFee;
      return result;
    }

    const baseRate = this.baseRates[vehicleType] || this.baseRates[1];
    result.baseFee = Math.round(distance * baseRate * 100) / 100;

    let discount = 1.0;
    if (cardType === '储值卡') {
      discount = this.discountRules['95折'];
      result.discountType = '95折';
    }
    if (vehicleType >= 5) {
      discount = this.discountRules['85折'];
      result.discountType = '85折';
    }
    result.discount = discount;
    result.discountFee = Math.round(result.baseFee * (1 - discount) * 100) / 100;
    result.actualFee = Math.round(result.baseFee * discount * 100) / 100;

    return result;
  }

  private checkHolidayFree(date: Date): { name: string } | null {
    const dateStr = date.toISOString().split('T')[0];
    for (const holiday of this.holidays) {
      if (dateStr >= holiday.start && dateStr <= holiday.end) {
        return { name: holiday.name };
      }
    }
    return null;
  }

  getHolidayInfo(date: Date): { isFree: boolean; holidayName: string; freePeriod: string } | null {
    const dateStr = date.toISOString().split('T')[0];
    for (const holiday of this.holidays) {
      if (dateStr >= holiday.start && dateStr <= holiday.end) {
        return {
          isFree: true,
          holidayName: holiday.name,
          freePeriod: `${holiday.start} 至 ${holiday.end}`,
        };
      }
    }
    return null;
  }
}

export class PathFitter {
  fitPath(gantryPoints: GantryPoint[]): FittedPath {
    if (gantryPoints.length < 2) {
      return {
        points: gantryPoints.map(p => ({ lat: p.location.lat, lng: p.location.lng })),
        distance: 0,
      };
    }

    const sortedPoints = [...gantryPoints].sort(
      (a, b) => new Date(a.passTime).getTime() - new Date(b.passTime).getTime()
    );

    const points = sortedPoints.map(p => ({
      lat: p.location.lat,
      lng: p.location.lng,
    }));

    const segments: FittedPath['segments'] = [];
    let totalDistance = 0;

    for (let i = 1; i < sortedPoints.length; i++) {
      const from = sortedPoints[i - 1];
      const to = sortedPoints[i];
      const dist = this.calculateDistance(
        { lat: from.location.lat, lng: from.location.lng },
        { lat: to.location.lat, lng: to.location.lng }
      );
      totalDistance += dist;
      segments?.push({
        from,
        to,
        distance: Math.round(dist * 100) / 100,
        fee: to.sectionFee,
      });
    }

    return {
      points,
      distance: Math.round(totalDistance * 100) / 100,
      segments,
    };
  }

  private calculateDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateTotalDistance(points: { lat: number; lng: number }[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += this.calculateDistance(points[i - 1], points[i]);
    }
    return Math.round(total * 100) / 100;
  }
}

export const tollEngine = new TollEngine();
export const pathFitter = new PathFitter();
