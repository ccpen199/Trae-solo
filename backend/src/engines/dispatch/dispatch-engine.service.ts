import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Location,
  MachineryCandidate,
  DispatchRequest,
  DispatchResult,
} from './types/dispatch.types';
import { MachineryStatus } from '@prisma/client';

@Injectable()
export class DispatchEngineService {
  constructor(private prisma: PrismaService) {}

  async matchMachinery(request: DispatchRequest): Promise<DispatchResult> {
    const availableMachineries = await this.prisma.machinery.findMany({
      where: {
        status: MachineryStatus.AVAILABLE,
        locationLng: { not: null },
        locationLat: { not: null },
        operatorId: { not: null },
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            creditScore: true,
          },
        },
      },
    });

    if (availableMachineries.length === 0) {
      throw new Error('暂无可用农机');
    }

    const candidates: MachineryCandidate[] = [];

    for (const machinery of availableMachineries) {
      if (!machinery.locationLng || !machinery.locationLat || !machinery.operator) {
        continue;
      }

      const machineryLocation: Location = {
        lng: machinery.locationLng,
        lat: machinery.locationLat,
      };

      const distance = this.calculateHaversineDistance(
        request.location,
        machineryLocation,
      );

      const score = this.calculateMatchScore(
        distance,
        machinery.operator.creditScore,
        machinery.capacity || 0,
        request.area,
      );

      candidates.push({
        id: machinery.id,
        name: machinery.name,
        type: machinery.type,
        capacity: machinery.capacity || undefined,
        operatorId: machinery.operator.id,
        operatorName: machinery.operator.name,
        creditScore: machinery.operator.creditScore,
        location: machineryLocation,
        distance,
        score,
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      throw new Error('未找到合适的农机');
    }

    return {
      demandId: request.demandId,
      candidates: candidates.slice(0, 5),
      recommended: candidates[0],
    };
  }

  private calculateHaversineDistance(from: Location, to: Location): number {
    const R = 6371;
    const dLat = this.toRadians(to.lat - from.lat);
    const dLng = this.toRadians(to.lng - from.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.lat)) *
        Math.cos(this.toRadians(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateMatchScore(
    distance: number,
    creditScore: number,
    capacity: number,
    requiredArea: number,
  ): number {
    const distanceWeight = 0.4;
    const creditWeight = 0.35;
    const capacityWeight = 0.25;

    let distanceScore = 0;
    if (distance <= 5) {
      distanceScore = 100;
    } else if (distance <= 10) {
      distanceScore = 80;
    } else if (distance <= 20) {
      distanceScore = 60;
    } else if (distance <= 30) {
      distanceScore = 40;
    } else {
      distanceScore = 20;
    }

    const creditNormalized = Math.min(creditScore / 100, 1) * 100;

    let capacityScore = 0;
    if (capacity >= requiredArea) {
      capacityScore = 100;
    } else if (capacity > 0) {
      capacityScore = (capacity / requiredArea) * 100;
    } else {
      capacityScore = 50;
    }

    const totalScore =
      distanceScore * distanceWeight +
      creditNormalized * creditWeight +
      capacityScore * capacityWeight;

    return totalScore;
  }

  async getRoute(
    origin: Location,
    destination: Location,
  ): Promise<{ distance: number; duration: number; polyline?: string }> {
    const distance = this.calculateHaversineDistance(origin, destination);
    const duration = distance / 40 * 60;

    return {
      distance,
      duration,
      polyline: undefined,
    };
  }
}
