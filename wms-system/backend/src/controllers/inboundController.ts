import { Request, Response } from 'express';
import { InboundOrder, InboundItem, Inventory, Location } from '../models/models';
import { LocationRecommendationEngine } from '../engines/locationRecommendationEngine';

// 模拟数据库
let inboundOrders: InboundOrder[] = [];
let inboundItems: InboundItem[] = [];
let inventory: Inventory[] = [];
let locations: Location[] = [
  { id: 'loc_001', code: 'A-01-01-01', type: 'shelf', capacity: 100, status: 'available', createdAt: new Date().toISOString() },
  { id: 'loc_002', code: 'A-01-01-02', type: 'shelf', capacity: 100, status: 'available', createdAt: new Date().toISOString() },
  { id: 'loc_003', code: 'A-01-02-01', type: 'shelf', capacity: 200, status: 'available', createdAt: new Date().toISOString() },
  { id: 'loc_004', code: 'A-01-02-02', type: 'shelf', capacity: 200, status: 'available', createdAt: new Date().toISOString() },
  { id: 'loc_005', code: 'B-01-01-01', type: 'bin', capacity: 50, status: 'available', createdAt: new Date().toISOString() }
];

export const createInboundOrder = (req: Request, res: Response) => {
  const { appointmentId, supplierId, items } = req.body;
  
  const newInboundOrder: InboundOrder = {
    id: `inbound_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    appointmentId,
    supplierId,
    status: 'pending',
    totalItems: items.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  inboundOrders.push(newInboundOrder);
  
  // 创建入库商品
  const newInboundItems = items.map((item: any) => {
    const newItem: InboundItem = {
      id: `inbound_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      inboundOrderId: newInboundOrder.id,
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      qualityStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    inboundItems.push(newItem);
    return newItem;
  });
  
  res.status(201).json({ order: newInboundOrder, items: newInboundItems });
};

export const processInboundItem = (req: Request, res: Response) => {
  const { id } = req.params;
  const { qualityStatus } = req.body;
  
  const item = inboundItems.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ message: 'Inbound item not found' });
  }
  
  item.qualityStatus = qualityStatus;
  
  if (qualityStatus === 'pass') {
    // 推荐库位
    try {
      const recommendedLocation = LocationRecommendationEngine.recommendLocation(
        item.sku,
        item.quantity,
        locations
      );
      item.locationId = recommendedLocation;
      
      // 更新库位状态
      const location = locations.find(l => l.id === recommendedLocation);
      if (location) {
        location.status = 'occupied';
      }
      
      // 创建库存记录
      const newInventory: Inventory = {
        id: `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        sku: item.sku,
        locationId: recommendedLocation,
        quantity: item.quantity,
        status: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inventory.push(newInventory);
    } catch (error) {
      console.error('Failed to recommend location:', error);
    }
  }
  
  res.json(item);
};

export const completeInboundOrder = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = inboundOrders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ message: 'Inbound order not found' });
  }
  
  const orderItems = inboundItems.filter(i => i.inboundOrderId === order.id);
  const allItemsProcessed = orderItems.every(i => i.qualityStatus !== 'pending');
  
  if (!allItemsProcessed) {
    return res.status(400).json({ message: 'Not all items have been processed' });
  }
  
  order.status = 'completed';
  order.updatedAt = new Date().toISOString();
  
  res.json(order);
};

export const getInboundOrders = (req: Request, res: Response) => {
  const { status } = req.query;
  let filteredOrders = inboundOrders;
  
  if (status) {
    filteredOrders = inboundOrders.filter(o => o.status === status);
  }
  
  res.json(filteredOrders);
};

export const getInboundOrderById = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = inboundOrders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ message: 'Inbound order not found' });
  }
  
  const items = inboundItems.filter(i => i.inboundOrderId === order.id);
  
  res.json({ order, items });
};