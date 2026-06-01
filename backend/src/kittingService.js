const { db } = require('./database');

function getMaterialTotalStock(materialId) {
  const result = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM inventory
    WHERE material_id = ?
  `).get(materialId);
  return result.total;
}

function getMaterialInTransit(materialId) {
  const result = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total,
           MIN(expected_arrival) as earliest_arrival
    FROM in_transit
    WHERE material_id = ? AND status = 'shipping'
  `).get(materialId);
  return { total: result.total, earliest_arrival: result.earliest_arrival };
}

function getMaterialIssued(workOrderId, materialId) {
  const issued = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM material_issues
    WHERE work_order_id = ? AND material_id = ?
  `).get(workOrderId, materialId);

  const returned = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM material_returns
    WHERE work_order_id = ? AND material_id = ?
  `).get(workOrderId, materialId);

  return issued.total - returned.total;
}

function getApprovedSubstitute(originalMaterialId) {
  return db.prepare(`
    SELECT sr.*, m.code as substitute_code, m.name as substitute_name
    FROM substitute_rules sr
    JOIN materials m ON sr.substitute_material_id = m.id
    WHERE sr.original_material_id = ?
      AND sr.approved = 1
      AND (sr.valid_from IS NULL OR sr.valid_from <= datetime('now'))
      AND (sr.valid_to IS NULL OR sr.valid_to >= datetime('now'))
    ORDER BY sr.priority ASC
    LIMIT 1
  `).get(originalMaterialId);
}

function calculateWorkOrderKitting(workOrderId) {
  const workOrder = db.prepare(`
    SELECT wo.*, p.name as product_name, p.code as product_code
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    WHERE wo.id = ?
  `).get(workOrderId);

  if (!workOrder) {
    throw new Error('工单不存在');
  }

  const bomItems = db.prepare(`
    SELECT bi.*, m.code as material_code, m.name as material_name, m.unit as material_unit
    FROM bom_items bi
    JOIN materials m ON bi.material_id = m.id
    WHERE bi.bom_id = ?
  `).all(workOrder.bom_id);

  const kittingResults = [];
  let allReady = true;

  db.prepare('DELETE FROM work_order_kitting WHERE work_order_id = ?').run(workOrderId);

  const insertKitting = db.prepare(`
    INSERT INTO work_order_kitting (
      work_order_id, material_id, required_qty, stock_qty, in_transit_qty,
      issued_qty, short_qty, is_substituted, substitute_material_id,
      substitute_approved, affected_process, status, checked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  for (const item of bomItems) {
    const requiredQty = item.quantity * workOrder.quantity;
    const stockQty = getMaterialTotalStock(item.material_id);
    const inTransit = getMaterialInTransit(item.material_id);
    const issuedQty = getMaterialIssued(workOrderId, item.material_id);
    
    let availableQty = stockQty + issuedQty;
    let shortQty = Math.max(0, requiredQty - availableQty);
    let isSubstituted = 0;
    let substituteMaterialId = null;
    let substituteApproved = 0;
    let status = 'ready';

    if (shortQty > 0) {
      const substitute = getApprovedSubstitute(item.material_id);
      if (substitute) {
        const substituteStock = getMaterialTotalStock(substitute.substitute_material_id);
        if (substituteStock >= shortQty) {
          isSubstituted = 1;
          substituteMaterialId = substitute.substitute_material_id;
          substituteApproved = 1;
          shortQty = 0;
          status = 'substituted';
        } else {
          status = 'shortage';
          allReady = false;
        }
      } else {
        status = 'shortage';
        allReady = false;
      }
    }

    kittingResults.push({
      material_id: item.material_id,
      material_code: item.material_code,
      material_name: item.material_name,
      material_unit: item.material_unit,
      required_qty: requiredQty,
      stock_qty: stockQty,
      in_transit_qty: inTransit.total,
      earliest_arrival: inTransit.earliest_arrival,
      issued_qty: issuedQty,
      short_qty: shortQty,
      process: item.process,
      status: status,
      is_substituted: isSubstituted,
      substitute_material_id: substituteMaterialId,
      substitute_approved: substituteApproved
    });

    insertKitting.run(
      workOrderId, item.material_id, requiredQty, stockQty, inTransit.total,
      issuedQty, shortQty, isSubstituted, substituteMaterialId,
      substituteApproved, item.process, status
    );
  }

  const kittingStatus = allReady ? 'ready' : 'shortage';
  db.prepare('UPDATE work_orders SET kitting_status = ? WHERE id = ?').run(kittingStatus, workOrderId);

  db.prepare(`
    INSERT INTO kitting_logs (work_order_id, action, new_status, operator, remark)
    VALUES (?, 'kitting_check', ?, 'system', '齐套检查完成')
  `).run(workOrderId, kittingStatus);

  return {
    work_order: workOrder,
    kitting_status: kittingStatus,
    items: kittingResults
  };
}

function getKittingBoard(params = {}) {
  const { production_line, status, sort_by } = params;
  
  let whereClause = 'WHERE 1=1';
  const queryParams = [];

  if (production_line) {
    whereClause += ' AND wo.production_line = ?';
    queryParams.push(production_line);
  }
  if (status) {
    whereClause += ' AND wo.kitting_status = ?';
    queryParams.push(status);
  }

  let orderBy = 'wo.planned_start_date ASC';
  if (sort_by === 'shortage') {
    orderBy = 'CASE wo.kitting_status WHEN "shortage" THEN 1 WHEN "pending" THEN 2 ELSE 3 END ASC';
  } else if (sort_by === 'arrival') {
    orderBy = '(SELECT MIN(expected_arrival) FROM in_transit WHERE material_id IN (SELECT material_id FROM work_order_kitting WHERE work_order_id = wo.id AND short_qty > 0)) ASC';
  }

  const workOrders = db.prepare(`
    SELECT wo.*, p.name as product_name, p.code as product_code,
           (SELECT COUNT(*) FROM work_order_kitting WHERE work_order_id = wo.id AND status = 'shortage') as shortage_items
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    ${whereClause}
    ORDER BY ${orderBy}
  `).all(...queryParams);

  return workOrders.map(wo => {
    const kittingItems = db.prepare(`
      SELECT wok.*, m.code as material_code, m.name as material_name,
             it.earliest_arrival
      FROM work_order_kitting wok
      JOIN materials m ON wok.material_id = m.id
      LEFT JOIN (
        SELECT material_id, MIN(expected_arrival) as earliest_arrival
        FROM in_transit WHERE status = 'shipping'
        GROUP BY material_id
      ) it ON wok.material_id = it.material_id
      WHERE wok.work_order_id = ?
    `).all(wo.id);

    return {
      ...wo,
      kitting_items: kittingItems
    };
  });
}

module.exports = {
  calculateWorkOrderKitting,
  getKittingBoard,
  getMaterialTotalStock,
  getMaterialInTransit,
  getMaterialIssued
};
