import express, { type Request, type Response } from 'express';
import { properties } from '../data/mockData.js';
import type { Property } from '../types/index.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const {
    page = '1',
    pageSize = '10',
    district,
    priceMin,
    priceMax,
    bedrooms,
    propertyType,
    status,
    keyword,
    sortBy = 'default',
    sortOrder = 'desc',
  } = req.query;

  let filtered = [...properties];

  if (district && district !== 'all') {
    filtered = filtered.filter((p) => p.district === district);
  }

  if (priceMin) {
    filtered = filtered.filter((p) => p.price >= Number(priceMin));
  }

  if (priceMax) {
    filtered = filtered.filter((p) => p.price <= Number(priceMax));
  }

  if (bedrooms && bedrooms !== 'all') {
    const bedroomNum = parseInt(bedrooms as string);
    filtered = filtered.filter((p) =>
      p.buildings.some((b) =>
        b.unitTypes.some((u) => u.bedrooms === bedroomNum),
      ),
    );
  }

  if (propertyType && propertyType !== 'all') {
    filtered = filtered.filter((p) => p.propertyType === propertyType);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (keyword) {
    const kw = (keyword as string).toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.address.toLowerCase().includes(kw) ||
        p.developer.name.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw)),
    );
  }

  if (sortBy === 'price') {
    filtered.sort((a, b) =>
      sortOrder === 'asc' ? a.price - b.price : b.price - a.price,
    );
  } else if (sortBy === 'sales') {
    filtered.sort((a, b) =>
      sortOrder === 'asc'
        ? a.monthlySales - b.monthlySales
        : b.monthlySales - a.monthlySales,
    );
  } else if (sortBy === 'greenRate') {
    filtered.sort((a, b) =>
      sortOrder === 'asc'
        ? a.greenRate - b.greenRate
        : b.greenRate - a.greenRate,
    );
  }

  const pageNum = parseInt(page as string);
  const size = parseInt(pageSize as string);
  const start = (pageNum - 1) * size;
  const end = start + size;
  const paginated = filtered.slice(start, end);

  res.json({
    success: true,
    data: {
      list: paginated,
      total: filtered.length,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size),
    },
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const property = properties.find((p) => p.id === id);

  if (!property) {
    res.status(404).json({
      success: false,
      error: '楼盘不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: property,
  });
});

router.get('/:id/licenses', (req: Request, res: Response) => {
  const { id } = req.params;
  const property = properties.find((p) => p.id === id);

  if (!property) {
    res.status(404).json({
      success: false,
      error: '楼盘不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: property.licenses,
  });
});

router.get('/:id/buildings', (req: Request, res: Response) => {
  const { id } = req.params;
  const property = properties.find((p) => p.id === id);

  if (!property) {
    res.status(404).json({
      success: false,
      error: '楼盘不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: property.buildings,
  });
});

router.get('/stats/summary', (req: Request, res: Response) => {
  const totalProperties = properties.length;
  const onSaleProperties = properties.filter((p) => p.status === '在售').length;
  const avgPrice = Math.round(
    properties.reduce((sum, p) => sum + p.price, 0) / properties.length,
  );
  const districts = [...new Set(properties.map((p) => p.district))];

  const districtStats = districts.map((d) => {
    const districtProps = properties.filter((p) => p.district === d);
    return {
      district: d,
      count: districtProps.length,
      avgPrice: Math.round(
        districtProps.reduce((sum, p) => sum + p.price, 0) / districtProps.length,
      ),
      avgSalesRate: Math.round(
        districtProps.reduce((sum, p) => sum + p.salesRate, 0) / districtProps.length,
      ),
    };
  });

  res.json({
    success: true,
    data: {
      totalProperties,
      onSaleProperties,
      avgPrice,
      districtCount: districts.length,
      districtStats,
    },
  });
});

router.get('/filters/options', (req: Request, res: Response) => {
  const districts = [...new Set(properties.map((p) => p.district))];
  const propertyTypes = [...new Set(properties.map((p) => p.propertyType))];
  const buildingTypes = [...new Set(properties.map((p) => p.buildingType))];
  const statuses = [...new Set(properties.map((p) => p.status))];
  const decorations = [...new Set(properties.map((p) => p.decoration))];

  const priceRanges = [
    { label: '10000以下', min: 0, max: 10000 },
    { label: '10000-15000', min: 10000, max: 15000 },
    { label: '15000-20000', min: 15000, max: 20000 },
    { label: '20000-25000', min: 20000, max: 25000 },
    { label: '25000以上', min: 25000, max: 999999 },
  ];

  const bedroomOptions = [
    { label: '全部', value: 'all' },
    { label: '2室', value: '2' },
    { label: '3室', value: '3' },
    { label: '4室及以上', value: '4+' },
  ];

  res.json({
    success: true,
    data: {
      districts: ['all', ...districts],
      propertyTypes: ['all', ...propertyTypes],
      buildingTypes: ['all', ...buildingTypes],
      statuses: ['all', ...statuses],
      decorations: ['all', ...decorations],
      priceRanges,
      bedroomOptions,
    },
  });
});

export default router;
