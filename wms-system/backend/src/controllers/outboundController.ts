import { Request, Response } from 'express';
import { OutboundOrder, OutboundItem, Inventory } from '../models/models';
import { WavePickEngine } from '../engines/wavePickEngine';
import { InventoryFreezeEngine } from '../engines/inventoryFreezeEngine';

// 模拟数据库
let outboundOrders: OutboundOrder[] = [];
let outboundItems: OutboundItem[] = [];
let inventory: Inventory[] = [];
let wavePicks: any[] = [];

// 初始化一些库存数据
inventory.push(
  { id: 'inv_001', sku: 'SKU001', locationId: 'loc_001', quantity: 100, status: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv_002', sku: 'SKU002', locationId: 'loc_002', quantity: 200, status: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv_003', sku: 'SKU003', locationId: 'loc_003', quantity: 150, status: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
);

export const createOutboundOrder = (req: Request, res: Response) => {
  const { orderId, customerId, items } = req.body;
  
  const newOutboundOrder: OutboundOrder = {
    id: `outbound_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderId,
    customerId,
    status: 'pending',
    totalItems: items.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  outboundOrders.push(newOutboundOrder);
  
  // 创建出库商品
  const newOutboundItems = items.map((item: any) => {
    // 查找库存
    const inventoryItem = inventory.find(i => i.sku === item.sku && i.status === 'normal');
    
    const newItem: OutboundItem = {
      id: `outbound_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      outboundOrderId: newOutboundOrder.id,
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      locationId: inventoryItem?.locationId || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    outboundItems.push(newItem);
    return newItem;
  });
  
  res.status(201).json({ order: newOutboundOrder, items: newOutboundItems });
};

export const generateWavePicks = (req: Request, res: Response) => {
  const { orderIds } = req.body;
  const orders = outboundOrders.filter(o => orderIds.includes(o.id) && o.status === 'pending');
  
  if (orders.length === 0) {
    return res.status(400).json({ message: 'No pending orders found' });
  }
  
  // 生成波次拣货任务
  const newWavePicks = WavePickEngine.generateWavePicks(orders);
  wavePicks.push(...newWavePicks);
  
  // 更新订单状态
  orders.forEach(order => {
    order.status = 'processing';
    order.updatedAt = new Date().toISOString();
  });
  
  res.json(newWavePicks);
};

export const pickItem = (req: Request, res: Response) => {
  const { id } = req.params;
  const item = outboundItems.find(i => i.id === id);
  
  if (!item) {
    return res.status(404).json({ message: 'Outbound item not found' });
  }
  
  // 冻结库存
  const inventoryItems = inventory.filter(i => i.sku === item.sku && i.status === 'normal');
  const freezeResult = InventoryFreezeEngine.freezeInventory(inventoryItems, item.quantity, 'Pick');
  
  if (freezeResult.remainingQuantity > 0) {
    return res.status(400).json({ message: 'Insufficient inventory' });
  }
  
  // 更新库存
  inventory = inventory.filter(i => !inventoryItems.some(inv => inv.id === i.id));
  inventory.push(...freezeResult.frozen);
  
  // 更新出库商品状态
  item.status = 'picked';
  
  res.json(item);
};

export const packItem = (req: Request, res: Response) => {
  const { id } = req.params;
  const item = outboundItems.find(i => i.id === id);
  
  if (!item) {
    return res.status(404).json({ message: 'Outbound item not found' });
  }
  
  if (item.status !== 'picked') {
    return res.status(400).json({ message: 'Item must be picked first' });
  }
  
  item.status = 'packed';
  res.json(item);
};

export const shipOrder = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = outboundOrders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ message: 'Outbound order not found' });
  }
  
  const orderItems = outboundItems.filter(i => i.outboundOrderId === order.id);
  const allItemsPacked = orderItems.every(i => i.status === 'packed');
  
  if (!allItemsPacked) {
    return res.status(400).json({ message: 'Not all items have been packed' });
  }
  
  // 扣减库存
  for (const item of orderItems) {
    inventory = inventory.filter(i => !(i.sku === item.sku && i.status === 'frozen'));
  }
  
  // 更新订单状态
  order.status = 'shipped';
  order.updatedAt = new Date().toISOString();
  
  // 更新商品状态
  orderItems.forEach(item => {
    item.status = 'shipped';
  });
  
  res.json(order);
};

export const getOutboundOrders = (req: Request, res: Response) => {
  const { status } = req.query;
  let filteredOrders = outboundOrders;
  
  if (status) {
    filteredOrders = outboundOrders.filter(o => o.status === status);
  }
  
  res.json(filteredOrders);
};

export const getOutboundOrderById = (req: Request, res: Response) => {
  const { id } = req.params;
  const order = outboundOrders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ message: 'Outbound order not found' });
  }
  
  const items = outboundItems.filter(i => i.outboundOrderId === order.id);
  
  res.json({ order, items });
};