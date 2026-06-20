import { Request, Response } from 'express';
import db from '../db';

interface HeatmapPoint {
  lng: number;
  lat: number;
  count: number;
  areaName: string;
}

interface HeatmapArea {
  id: string;
  areaName: string;
  driverCount: number;
  averageResponseTime: number;
  orderCount: number;
  saturation: number;
  lng: number;
  lat: number;
}

const fallbackAreas = [
  { id: 1, area_code: 'BJ-CY', area_name: '朝阳区', available_drivers: 15, avg_response_time: 8.5, lng: 116.4551, lat: 39.9271 },
  { id: 2, area_code: 'BJ-HD', area_name: '海淀区', available_drivers: 12, avg_response_time: 10.2, lng: 116.2980, lat: 39.9599 },
  { id: 3, area_code: 'BJ-DC', area_name: '东城区', available_drivers: 8, avg_response_time: 12.1, lng: 116.4100, lat: 39.9200 },
  { id: 4, area_code: 'BJ-XC', area_name: '西城区', available_drivers: 7, avg_response_time: 11.5, lng: 116.3700, lat: 39.9100 },
  { id: 5, area_code: 'BJ-FT', area_name: '丰台区', available_drivers: 10, avg_response_time: 9.8, lng: 116.2869, lat: 39.8637 },
  { id: 6, area_code: 'BJ-SJS', area_name: '石景山区', available_drivers: 5, avg_response_time: 15.3, lng: 116.2228, lat: 39.9056 },
  { id: 7, area_code: 'BJ-TZ', area_name: '通州区', available_drivers: 9, avg_response_time: 14.0, lng: 116.6560, lat: 39.9080 },
  { id: 8, area_code: 'BJ-CP', area_name: '昌平区', available_drivers: 6, avg_response_time: 16.5, lng: 116.2350, lat: 40.2200 },
];

export const getHeatmapData = (_req: Request, res: Response) => {
  try {
    let areas = db.prepare('SELECT * FROM heatmap_data ORDER BY id').all() as any[];

    if (!areas || areas.length === 0) {
      areas = fallbackAreas;
    }

    const totalDrivers = areas.reduce((sum: number, a: any) => sum + (a.available_drivers ?? 0), 0);
    const avgResponseTime = areas.length > 0
      ? parseFloat((areas.reduce((sum: number, a: any) => sum + (a.avg_response_time ?? 0), 0) / areas.length).toFixed(1))
      : 10.0;

    const points: HeatmapPoint[] = areas.map(area => ({
      lng: Number(area.lng) || 0,
      lat: Number(area.lat) || 0,
      count: Number(area.available_drivers) || 0,
      areaName: String(area.area_name || ''),
    }));

    const areaDetails: HeatmapArea[] = areas.map(area => {
      const driverCount = Number(area.available_drivers) || 0;
      return {
        id: String(area.id ?? ''),
        areaName: String(area.area_name || ''),
        driverCount: driverCount,
        averageResponseTime: Number(area.avg_response_time) || 0,
        orderCount: Math.floor(driverCount * 1.5),
        saturation: Math.min(driverCount / 20, 1),
        lng: Number(area.lng) || 0,
        lat: Number(area.lat) || 0,
      };
    });

    res.success({
      points: points,
      areas: areaDetails,
      totalDrivers: totalDrivers,
      totalAreas: areas.length,
      averageResponseTime: avgResponseTime,
      updateTime: new Date().toISOString(),
    });
  } catch (error) {
    res.error('Failed to fetch heatmap data');
  }
};

export const getAreaDetails = (req: Request, res: Response) => {
  try {
    const { areaId } = req.query;
    let areas = db.prepare('SELECT * FROM heatmap_data ORDER BY id').all() as any[];

    if (!areas || areas.length === 0) {
      areas = fallbackAreas;
    }

    if (areaId) {
      areas = areas.filter(a => String(a.id) === String(areaId));
    }

    const details: HeatmapArea[] = areas.map(area => {
      const driverCount = Number(area.available_drivers) || 0;
      return {
        id: String(area.id ?? ''),
        areaName: String(area.area_name || ''),
        driverCount: driverCount,
        averageResponseTime: Number(area.avg_response_time) || 0,
        orderCount: Math.floor(driverCount * 1.5),
        saturation: Math.min(driverCount / 20, 1),
        lng: Number(area.lng) || 0,
        lat: Number(area.lat) || 0,
      };
    });

    res.success(details);
  } catch (error) {
    res.error('Failed to fetch area details');
  }
};
