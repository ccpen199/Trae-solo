import express from 'express';
import { generateStations } from '../mock/data';
import type { ApiResponse, Station } from '../../shared/types';

const router = express.Router();
const stations = generateStations();

router.get('/', (req, res) => {
  const { region, category, page = '1', pageSize = '20' } = req.query;
  let filtered = [...stations];
  
  if (region) {
    filtered = filtered.filter(s => s.province.includes(region as string) || s.city.includes(region as string));
  }

  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const start = (pageNum - 1) * pageSizeNum;
  const paginated = filtered.slice(start, start + pageSizeNum);

  const response: ApiResponse<Station[]> = {
    success: true,
    data: paginated,
    total: filtered.length,
    page: pageNum,
    pageSize: pageSizeNum,
  };
  res.json(response);
});

router.get('/:id', (req, res) => {
  const station = stations.find(s => s.id === req.params.id);
  if (!station) {
    res.status(404).json({ success: false, message: '回收站不存在' });
    return;
  }
  
  const response: ApiResponse<Station> = {
    success: true,
    data: station,
  };
  res.json(response);
});

router.put('/:id', (req, res) => {
  const { name, address, serviceRadius, certifications } = req.body;
  const station = stations.find(s => s.id === req.params.id);
  if (!station) {
    res.status(404).json({ success: false, message: '回收站不存在' });
    return;
  }
  
  if (name) station.name = name;
  if (address) station.address = address;
  if (serviceRadius) station.serviceRadius = Number(serviceRadius);
  if (certifications) station.certifications = certifications;
  
  const response: ApiResponse<{ success: boolean }> = {
    success: true,
    data: { success: true },
    message: '回收站信息更新成功',
  };
  res.json(response);
});

export default router;
