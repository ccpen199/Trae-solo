import { Request, Response } from 'express';
import db from '../db';

export const getHeatmapData = (_req: Request, res: Response) => {
  try {
    const areas = db.prepare('SELECT * FROM heatmap_data ORDER BY id').all() as any[];

    const totalDrivers = areas.reduce((sum: number, a: any) => sum + (a.available_drivers || 0), 0);
    const avgResponseTime = areas.length > 0
      ? parseFloat((areas.reduce((sum: number, a: any) => sum + (a.avg_response_time || 0), 0) / areas.length).toFixed(1))
      : 0;

    const points = areas.map(area => ({
      lng: area.lng,
      lat: area.lat,
      count: area.available_drivers,
      areaName: area.area_name,
    }));

    const areaDetails = areas.map(area => ({
      id: String(area.id),
      areaName: area.area_name,
      driverCount: area.available_drivers,
      averageResponseTime: area.avg_response_time,
      orderCount: Math.floor(area.available_drivers * 1.5),
      saturation: Math.min(area.available_drivers / 20, 1),
      lng: area.lng,
      lat: area.lat,
    }));

    res.success({
      points,
      areas: areaDetails,
      totalDrivers,
      totalAreas: areas.length,
      averageResponseTime: avgResponseTime,
      updateTime: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    res.error('Failed to fetch heatmap data');
  }
};

export const getAreaDetails = (req: Request, res: Response) => {
  try {
    const { areaId } = req.query;
    let areas = db.prepare('SELECT * FROM heatmap_data ORDER BY id').all() as any[];

    if (areaId) {
      areas = areas.filter(a => String(a.id) === areaId);
    }

    const details = areas.map(area => ({
      id: String(area.id),
      areaName: area.area_name,
      driverCount: area.available_drivers,
      averageResponseTime: area.avg_response_time,
      orderCount: Math.floor(area.available_drivers * 1.5),
      saturation: Math.min(area.available_drivers / 20, 1),
      lng: area.lng,
      lat: area.lat,
    }));

    res.success(details);
  } catch (error) {
    res.error('Failed to fetch area details');
  }
};
