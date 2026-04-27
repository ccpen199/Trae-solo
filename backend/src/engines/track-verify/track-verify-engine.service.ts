import { Injectable } from '@nestjs/common';
import {
  TrackPoint,
  VerifyRequest,
  VerifyResult,
  VerifyIssue,
} from './types/track-verify.types';

@Injectable()
export class TrackVerifyEngineService {
  async verify(request: VerifyRequest): Promise<VerifyResult> {
    const { tracks, expectedArea, location } = request;
    const issues: VerifyIssue[] = [];

    if (tracks.length < 2) {
      issues.push({
        type: 'gap_detected',
        severity: 'high',
        message: '轨迹点数不足，无法核验',
      });

      return {
        valid: false,
        confidence: 0,
        actualArea: 0,
        actualDuration: 0,
        issues,
        details: {
          areaRatio: 0,
          locationCoverage: 0,
          speedAverage: 0,
          trackCount: tracks.length,
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
        },
      };
    }

    const sortedTracks = [...tracks].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const actualArea = this.calculateAreaFromTracks(sortedTracks);

    const { start, end, duration } = this.calculateTimeRange(sortedTracks);

    const locationCoverage = this.calculateLocationCoverage(sortedTracks, location);

    const speedAverage = this.calculateAverageSpeed(sortedTracks);

    const areaRatio = expectedArea > 0 ? actualArea / expectedArea : 1;

    if (areaRatio < 0.7) {
      issues.push({
        type: 'area_mismatch',
        severity: 'high',
        message: `作业面积不足，实际面积 ${actualArea.toFixed(2)} 亩，预期 ${expectedArea.toFixed(2)} 亩`,
        details: { actualArea, expectedArea, ratio: areaRatio },
      });
    } else if (areaRatio < 0.85) {
      issues.push({
        type: 'area_mismatch',
        severity: 'medium',
        message: `作业面积略有不足，实际面积 ${actualArea.toFixed(2)} 亩，预期 ${expectedArea.toFixed(2)} 亩`,
        details: { actualArea, expectedArea, ratio: areaRatio },
      });
    }

    if (locationCoverage < 0.6) {
      issues.push({
        type: 'location_mismatch',
        severity: 'high',
        message: `作业位置偏离预订地点，覆盖率仅 ${(locationCoverage * 100).toFixed(1)}%`,
        details: { locationCoverage },
      });
    }

    this.checkSpeedAnomalies(sortedTracks, issues);
    this.checkTimeGaps(sortedTracks, issues);

    const confidence = this.calculateConfidence(
      areaRatio,
      locationCoverage,
      issues,
    );

    const valid = confidence >= 0.6;

    return {
      valid,
      confidence,
      actualArea,
      actualDuration: duration,
      issues,
      details: {
        areaRatio,
        locationCoverage,
        speedAverage,
        trackCount: sortedTracks.length,
        timeRange: {
          start,
          end,
        },
      },
    };
  }

  private calculateAreaFromTracks(tracks: TrackPoint[]): number {
    if (tracks.length < 3) {
      return 0;
    }

    const uniquePoints = this.removeDuplicatePoints(tracks);
    if (uniquePoints.length < 3) {
      return 0;
    }

    const convexHull = this.calculateConvexHull(uniquePoints);
    if (convexHull.length < 3) {
      return this.calculateApproximateArea(uniquePoints);
    }

    const areaSqMeters = this.calculatePolygonArea(convexHull);
    const areaMu = areaSqMeters / 666.67;

    return areaMu;
  }

  private removeDuplicatePoints(points: TrackPoint[]): TrackPoint[] {
    const unique: TrackPoint[] = [];
    const seen = new Set<string>();

    for (const point of points) {
      const key = `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(point);
      }
    }

    return unique;
  }

  private calculateConvexHull(points: TrackPoint[]): TrackPoint[] {
    if (points.length < 3) return points;

    const sorted = [...points].sort((a, b) => {
      if (a.lng === b.lng) return a.lat - b.lat;
      return a.lng - b.lng;
    });

    const buildHull = (pts: TrackPoint[]): TrackPoint[] => {
      const hull: TrackPoint[] = [];
      for (const p of pts) {
        while (hull.length >= 2) {
          const a = hull[hull.length - 2];
          const b = hull[hull.length - 1];
          const cross =
            (b.lng - a.lng) * (p.lat - a.lat) -
            (b.lat - a.lat) * (p.lng - a.lng);
          if (cross <= 0) {
            hull.pop();
          } else {
            break;
          }
        }
        hull.push(p);
      }
      return hull;
    };

    const lower = buildHull(sorted);
    const upper = buildHull(sorted.reverse());

    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }

  private calculatePolygonArea(points: TrackPoint[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    const R = 6371000;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      const p1LatRad = (p1.lat * Math.PI) / 180;
      const p1LngRad = (p1.lng * Math.PI) / 180;
      const p2LatRad = (p2.lat * Math.PI) / 180;
      const p2LngRad = (p2.lng * Math.PI) / 180;

      area +=
        (p2LngRad - p1LngRad) *
        (2 + Math.sin(p1LatRad) + Math.sin(p2LatRad));
    }

    area = Math.abs((area * R * R) / 2);
    return area;
  }

  private calculateApproximateArea(points: TrackPoint[]): number {
    if (points.length < 2) return 0;

    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    for (const point of points) {
      minLng = Math.min(minLng, point.lng);
      maxLng = Math.max(maxLng, point.lng);
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
    }

    const centerLat = (minLat + maxLat) / 2;
    const latDegToMeters = 111000;
    const lngDegToMeters = 111000 * Math.cos((centerLat * Math.PI) / 180);

    const width = (maxLng - minLng) * lngDegToMeters;
    const height = (maxLat - minLat) * latDegToMeters;

    const areaSqMeters = width * height * 0.6;
    return areaSqMeters / 666.67;
  }

  private calculateTimeRange(tracks: TrackPoint[]): {
    start: Date;
    end: Date;
    duration: number;
  } {
    const start = tracks[0].timestamp;
    const end = tracks[tracks.length - 1].timestamp;
    const duration = (end.getTime() - start.getTime()) / 1000 / 60;

    return { start, end, duration };
  }

  private calculateLocationCoverage(
    tracks: TrackPoint[],
    center: { lng: number; lat: number },
  ): number {
    const maxDistance = 2;
    let withinRange = 0;

    for (const track of tracks) {
      const distance = this.haversineDistance(
        center.lng,
        center.lat,
        track.lng,
        track.lat,
      );
      if (distance <= maxDistance) {
        withinRange++;
      }
    }

    return tracks.length > 0 ? withinRange / tracks.length : 0;
  }

  private haversineDistance(
    lng1: number,
    lat1: number,
    lng2: number,
    lat2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateAverageSpeed(tracks: TrackPoint[]): number {
    let totalSpeed = 0;
    let count = 0;

    for (const track of tracks) {
      if (track.speed !== undefined && track.speed > 0) {
        totalSpeed += track.speed;
        count++;
      }
    }

    return count > 0 ? totalSpeed / count : 0;
  }

  private checkSpeedAnomalies(
    tracks: TrackPoint[],
    issues: VerifyIssue[],
  ): void {
    for (let i = 1; i < tracks.length; i++) {
      const prev = tracks[i - 1];
      const curr = tracks[i];

      const timeDiff =
        (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

      if (timeDiff < 1) continue;

      const distance = this.haversineDistance(
        prev.lng,
        prev.lat,
        curr.lng,
        curr.lat,
      );

      const speed = (distance * 1000) / timeDiff * 3.6;

      if (speed > 60) {
        issues.push({
          type: 'speed_anomaly',
          severity: 'high',
          message: `检测到异常速度 ${speed.toFixed(1)} km/h，可能存在轨迹造假`,
          details: {
            timestamp: curr.timestamp.toISOString(),
            speed,
          },
        });
        break;
      }
    }
  }

  private checkTimeGaps(
    tracks: TrackPoint[],
    issues: VerifyIssue[],
  ): void {
    for (let i = 1; i < tracks.length; i++) {
      const timeDiff =
        (tracks[i].timestamp.getTime() -
          tracks[i - 1].timestamp.getTime()) /
        1000 /
        60;

      if (timeDiff > 30) {
        issues.push({
          type: 'gap_detected',
          severity: 'medium',
          message: `检测到 ${timeDiff.toFixed(1)} 分钟的轨迹空白`,
          details: {
            gapStart: tracks[i - 1].timestamp.toISOString(),
            gapEnd: tracks[i].timestamp.toISOString(),
            duration: timeDiff,
          },
        });
      }
    }
  }

  private calculateConfidence(
    areaRatio: number,
    locationCoverage: number,
    issues: VerifyIssue[],
  ): number {
    let confidence = 0.5;
    confidence += Math.min(areaRatio, 1) * 0.3;
    confidence += locationCoverage * 0.2;

    for (const issue of issues) {
      if (issue.severity === 'high') {
        confidence -= 0.2;
      } else if (issue.severity === 'medium') {
        confidence -= 0.1;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
