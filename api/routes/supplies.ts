import express from 'express';
import { generateSupplies } from '../mock/data';
import type { ApiResponse, Supply, SupplyFilter, Inquiry } from '../../shared/types';

const router = express.Router();
let suppliesCache = generateSupplies(50);

router.get('/', (req, res) => {
  const { category, minTonnage, maxTonnage, minPurity, region, certified, keyword, page = '1', pageSize = '20' } = req.query as SupplyFilter;
  
  let filtered = [...suppliesCache];
  
  if (category) {
    filtered = filtered.filter(s => s.categoryId === category || s.categoryName.includes(category as string));
  }
  if (minTonnage) {
    filtered = filtered.filter(s => s.tonnage >= Number(minTonnage));
  }
  if (maxTonnage) {
    filtered = filtered.filter(s => s.tonnage <= Number(maxTonnage));
  }
  if (minPurity) {
    filtered = filtered.filter(s => s.purity >= Number(minPurity));
  }
  if (region) {
    filtered = filtered.filter(s => s.province.includes(region as string) || s.city.includes(region as string));
  }
  if (certified !== undefined) {
    filtered = filtered.filter(s => s.certified === Boolean(certified));
  }
  if (keyword) {
    const kw = (keyword as string).toLowerCase();
    filtered = filtered.filter(s => 
      s.categoryName.toLowerCase().includes(kw) ||
      s.supplierName.toLowerCase().includes(kw) ||
      s.description.toLowerCase().includes(kw)
    );
  }

  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const start = (pageNum - 1) * pageSizeNum;
  const paginated = filtered.slice(start, start + pageSizeNum);

  const response: ApiResponse<Supply[]> = {
    success: true,
    data: paginated,
    total: filtered.length,
    page: pageNum,
    pageSize: pageSizeNum,
  };
  res.json(response);
});

router.post('/', (req, res) => {
  const { category, tonnage, purity, description, price, location, images } = req.body;
  const newSupply: Supply = {
    id: Math.random().toString(36).substring(2, 9),
    categoryId: category,
    categoryName: category,
    supplierId: 'u1',
    supplierName: '北京鑫源回收站',
    tonnage: Number(tonnage),
    purity: Number(purity),
    price: Number(price),
    unit: '元/吨',
    province: location?.province || '',
    city: location?.city || '',
    address: location?.address || '',
    description: description || '',
    images: images || [],
    certified: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    viewCount: 0,
    inquiryCount: 0,
  };
  suppliesCache.unshift(newSupply);
  
  const response: ApiResponse<{ supplyId: string }> = {
    success: true,
    data: { supplyId: newSupply.id },
    message: '货源发布成功',
  };
  res.json(response);
});

router.get('/:id', (req, res) => {
  const supply = suppliesCache.find(s => s.id === req.params.id);
  if (!supply) {
    res.status(404).json({ success: false, message: '货源不存在' });
    return;
  }
  supply.viewCount += 1;
  
  const response: ApiResponse<Supply> = {
    success: true,
    data: supply,
  };
  res.json(response);
});

router.post('/:id/inquiry', (req, res) => {
  const { message, expectedPrice } = req.body;
  const inquiry: Inquiry = {
    id: Math.random().toString(36).substring(2, 9),
    supplyId: req.params.id,
    supplyTitle: '废铜 100吨',
    buyerId: 'u3',
    buyerName: '江西铜业集团',
    expectedPrice: expectedPrice ? Number(expectedPrice) : undefined,
    message: message || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  const supply = suppliesCache.find(s => s.id === req.params.id);
  if (supply) {
    supply.inquiryCount += 1;
  }
  
  const response: ApiResponse<{ inquiryId: string }> = {
    success: true,
    data: { inquiryId: inquiry.id },
    message: '询价已发送，货源方将尽快回复',
  };
  res.json(response);
});

export default router;
