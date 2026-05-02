import { Request, Response } from 'express';
import { Inventory, InventoryAudit, AuditItem } from '../models/models';
import { AuditDiscrepancyEngine } from '../engines/auditDiscrepancyEngine';

let inventory: Inventory[] = [];
let audits: InventoryAudit[] = [];
let auditItems: AuditItem[] = [];

inventory.push(
  { id: 'inv_001', sku: 'SKU001', locationId: 'loc_001', quantity: 100, status: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv_002', sku: 'SKU002', locationId: 'loc_002', quantity: 200, status: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv_003', sku: 'SKU003', locationId: 'loc_003', quantity: 150, status: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
);

export const createAudit = (req: Request, res: Response): void => {
  const { auditType } = req.body as { auditType: 'cycle' | 'dynamic' };

  const newAudit: InventoryAudit = {
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    auditType,
    status: 'pending',
    startTime: new Date().toISOString(),
    totalItems: inventory.length,
    discrepancyItems: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  audits.push(newAudit);
  res.status(201).json(newAudit);
};

export const startAudit = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const audit = audits.find(a => a.id === id);

  if (!audit) {
    res.status(404).json({ message: 'Audit not found' });
    return;
  }

  audit.status = 'processing';
  audit.updatedAt = new Date().toISOString();
  res.json(audit);
};

export const submitAuditResults = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const { actualInventory } = req.body as { actualInventory: Record<string, number> };

  const audit = audits.find(a => a.id === id);
  if (!audit) {
    res.status(404).json({ message: 'Audit not found' });
    return;
  }

  const actualInventoryMap = new Map<string, number>(Object.entries(actualInventory));
  const calculatedItems: AuditItem[] = AuditDiscrepancyEngine.calculateDiscrepancy(inventory, actualInventoryMap);

  const newAuditItems: AuditItem[] = calculatedItems.map((item: AuditItem): AuditItem => {
    const newItem: AuditItem = {
      id: item.id,
      auditId: id,
      sku: item.sku,
      locationId: item.locationId,
      systemQuantity: item.systemQuantity,
      actualQuantity: item.actualQuantity,
      discrepancy: item.discrepancy,
      status: item.status,
      createdAt: item.createdAt
    };
    return newItem;
  });

  auditItems.push(...newAuditItems);

  const discrepancyAnalysis = AuditDiscrepancyEngine.analyzeDiscrepancy(newAuditItems);

  audit.status = 'completed';
  audit.endTime = new Date().toISOString();
  audit.discrepancyItems = discrepancyAnalysis.topDiscrepancyItems.length;
  audit.updatedAt = new Date().toISOString();

  res.json({
    audit,
    items: newAuditItems,
    analysis: discrepancyAnalysis
  });
};

export const adjustInventory = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const { approvalRequired } = req.body as { approvalRequired: boolean };

  const audit = audits.find(a => a.id === id);
  if (!audit) {
    res.status(404).json({ message: 'Audit not found' });
    return;
  }

  const items = auditItems.filter(i => i.auditId === id);
  const adjustmentResult = AuditDiscrepancyEngine.autoAdjustInventory(items, approvalRequired);

  if (!approvalRequired) {
    for (const item of adjustmentResult.adjustedItems) {
      if (item.discrepancy !== 0) {
        const inventoryItem = inventory.find(i => i.sku === item.sku);
        if (inventoryItem) {
          inventoryItem.quantity = item.actualQuantity;
          inventoryItem.updatedAt = new Date().toISOString();
        } else {
          inventory.push({
            id: `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            sku: item.sku,
            locationId: item.locationId,
            quantity: item.actualQuantity,
            status: 'normal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  res.json(adjustmentResult);
};

export const getAudits = (req: Request, res: Response): void => {
  const { status, auditType } = req.query;
  let filteredAudits = audits;

  if (status) {
    filteredAudits = filteredAudits.filter(a => a.status === status);
  }

  if (auditType) {
    filteredAudits = filteredAudits.filter(a => a.auditType === auditType);
  }

  res.json(filteredAudits);
};

export const getAuditById = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const audit = audits.find(a => a.id === id);

  if (!audit) {
    res.status(404).json({ message: 'Audit not found' });
    return;
  }

  const items = auditItems.filter(i => i.auditId === audit.id);
  res.json({ audit, items });
};