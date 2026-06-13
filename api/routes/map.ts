import express, { type Request, type Response } from 'express';
import { subwayStations, schoolDistricts, properties } from '../data/mockData.js';

const router = express.Router();

router.get('/heatmap', (req: Request, res: Response) => {
  const { type = 'price' } = req.query;

  const heatmapPoints = properties.map((p) => {
    let value = 0;
    if (type === 'price') {
      value = p.price / 1000;
    } else if (type === 'transaction') {
      value = p.monthlySales;
    } else if (type === 'popularity') {
      value = p.salesRate;
    }
    return {
      lat: p.lat,
      lng: p.lng,
      value,
      type,
    };
  });

  const extraPoints = [
    { lat: 41.7856, lng: 123.4421, value: type === 'price' ? 22 : type === 'transaction' ? 35 : 85 },
    { lat: 41.7989, lng: 123.4356, value: type === 'price' ? 24 : type === 'transaction' ? 40 : 90 },
    { lat: 41.8012, lng: 123.4512, value: type === 'price' ? 20 : type === 'transaction' ? 32 : 82 },
    { lat: 41.8234, lng: 123.4256, value: type === 'price' ? 17 : type === 'transaction' ? 28 : 75 },
    { lat: 41.7689, lng: 123.4421, value: type === 'price' ? 19 : type === 'transaction' ? 30 : 78 },
    { lat: 41.8056, lng: 123.3892, value: type === 'price' ? 15 : type === 'transaction' ? 25 : 70 },
    { lat: 41.7823, lng: 123.4789, value: type === 'price' ? 23 : type === 'transaction' ? 20 : 65 },
    { lat: 41.7589, lng: 123.3967, value: type === 'price' ? 13 : type === 'transaction' ? 38 : 80 },
    { lat: 41.8956, lng: 123.4892, value: type === 'price' ? 14 : type === 'transaction' ? 22 : 68 },
    { lat: 41.8123, lng: 123.5123, value: type === 'price' ? 16 : type === 'transaction' ? 18 : 62 },
    { lat: 41.6789, lng: 123.3789, value: type === 'price' ? 10 : type === 'transaction' ? 42 : 88 },
    { lat: 41.7956, lng: 123.4356, value: type === 'price' ? 26 : type === 'transaction' ? 12 : 55 },
  ];

  res.json({
    success: true,
    data: [...heatmapPoints, ...extraPoints],
  });
});

router.get('/subway', (req: Request, res: Response) => {
  const { line, radius } = req.query;

  let filtered = [...subwayStations];

  if (line && line !== 'all') {
    filtered = filtered.filter((s) => s.line.includes(line as string));
  }

  if (radius) {
    filtered = filtered.map((s) => ({
      ...s,
      radius: Number(radius),
    }));
  }

  const lines = [...new Set(subwayStations.flatMap((s) => s.line.split('/')))];

  res.json({
    success: true,
    data: {
      stations: filtered,
      lines: ['all', ...lines],
    },
  });
});

router.get('/subway/:id/properties', (req: Request, res: Response) => {
  const { id } = req.params;
  const station = subwayStations.find((s) => s.id === id);

  if (!station) {
    res.status(404).json({
      success: false,
      error: '地铁站不存在',
    });
    return;
  }

  const radius = station.radius / 111000;
  const nearbyProperties = properties.filter((p) => {
    const dx = (p.lng - station.lng) * Math.cos((station.lat * Math.PI) / 180);
    const dy = p.lat - station.lat;
    const distance = Math.sqrt(dx * dx + dy * dy) * 111000;
    return distance <= station.radius;
  });

  res.json({
    success: true,
    data: {
      station,
      properties: nearbyProperties,
      propertyCount: nearbyProperties.length,
      avgPrice: nearbyProperties.length
        ? Math.round(nearbyProperties.reduce((sum, p) => sum + p.price, 0) / nearbyProperties.length)
        : 0,
    },
  });
});

router.get('/schools', (req: Request, res: Response) => {
  const { type, level } = req.query;

  let filtered = [...schoolDistricts];

  if (type && type !== 'all') {
    filtered = filtered.filter((s) => s.type === type);
  }

  if (level && level !== 'all') {
    filtered = filtered.filter((s) => s.level === level);
  }

  res.json({
    success: true,
    data: filtered,
  });
});

router.get('/schools/:id/properties', (req: Request, res: Response) => {
  const { id } = req.params;
  const school = schoolDistricts.find((s) => s.id === id);

  if (!school) {
    res.status(404).json({
      success: false,
      error: '学区不存在',
    });
    return;
  }

  const schoolProperties = properties.filter((p) =>
    school.correspondingProperties.includes(p.id),
  );

  res.json({
    success: true,
    data: {
      school,
      properties: schoolProperties,
      propertyCount: schoolProperties.length,
      avgPrice: schoolProperties.length
        ? Math.round(schoolProperties.reduce((sum, p) => sum + p.price, 0) / schoolProperties.length)
        : 0,
    },
  });
});

router.get('/properties/nearby', (req: Request, res: Response) => {
  const { lat, lng, radius = '2000' } = req.query;

  if (!lat || !lng) {
    res.status(400).json({
      success: false,
      error: '缺少经纬度参数',
    });
    return;
  }

  const centerLat = parseFloat(lat as string);
  const centerLng = parseFloat(lng as string);
  const radiusKm = parseFloat(radius as string);

  const nearbyProperties = properties
    .map((p) => {
      const dx = (p.lng - centerLng) * Math.cos((centerLat * Math.PI) / 180);
      const dy = p.lat - centerLat;
      const distance = Math.sqrt(dx * dx + dy * dy) * 111000;
      return { ...p, distance: Math.round(distance) };
    })
    .filter((p) => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    data: {
      properties: nearbyProperties,
      count: nearbyProperties.length,
      avgPrice: nearbyProperties.length
        ? Math.round(nearbyProperties.reduce((sum, p) => sum + p.price, 0) / nearbyProperties.length)
        : 0,
    },
  });
});

router.get('/map/properties', (req: Request, res: Response) => {
  const { bounds } = req.query;

  let filtered = properties.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    price: p.price,
    status: p.status,
    propertyType: p.propertyType,
    district: p.district,
    totalPriceRange: p.totalPriceRange,
  }));

  if (bounds) {
    try {
      const boundsObj = JSON.parse(bounds as string);
      const { north, south, east, west } = boundsObj;
      filtered = filtered.filter(
        (p) => p.lat >= south && p.lat <= north && p.lng >= west && p.lng <= east,
      );
    } catch (e) {
      // ignore parse error
    }
  }

  res.json({
    success: true,
    data: filtered,
  });
});

export default router;
