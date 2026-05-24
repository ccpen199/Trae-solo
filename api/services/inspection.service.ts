import db, { run, get } from '../config/database.js'
import type { Inspection, InspectionItem, PaintworkItem, Car, User } from '../types/index.js'

interface InspectionRow {
  id: number
  car_id: number
  inspector_id: number
  accident_json: string
  water_damage_json: string
  fire_damage_json: string
  maintenance_json: string
  paintwork_json: string
  road_test_json: string
  overall_score: number
  overall_comment: string
  status: string
  auditor_id?: number
  audit_comment?: string
  audited_at?: string
  created_at: string
}

interface CarRow {
  id: number
  vin: string
  brand: string
  model: string
  year: number
  month: number
  mileage: number
  color: string
  price: number
  original_price?: number
  configuration: string
  images_json: string
  documents_json: string
  dealer_id: number
  status: string
  created_at: string
  updated_at: string
}

interface UserRow {
  id: number
  username: string
  name: string
  role: string
  phone: string
  email?: string
  status: string
  created_at: string
}

function parseInspectionRow(row: InspectionRow): Inspection {
  return {
    id: row.id,
    carId: row.car_id,
    inspectorId: row.inspector_id,
    accident: JSON.parse(row.accident_json),
    waterDamage: JSON.parse(row.water_damage_json),
    fireDamage: JSON.parse(row.fire_damage_json),
    maintenance: JSON.parse(row.maintenance_json),
    paintwork: JSON.parse(row.paintwork_json),
    roadTest: JSON.parse(row.road_test_json),
    overallScore: row.overall_score,
    overallComment: row.overall_comment,
    status: row.status as Inspection['status'],
    auditorId: row.auditor_id,
    auditComment: row.audit_comment,
    auditedAt: row.audited_at,
    createdAt: row.created_at
  }
}

function parseCarRow(row: CarRow): Car {
  return {
    id: row.id,
    vin: row.vin,
    brand: row.brand,
    model: row.model,
    year: row.year,
    month: row.month,
    mileage: row.mileage,
    color: row.color,
    price: row.price,
    originalPrice: row.original_price,
    configuration: row.configuration,
    images: JSON.parse(row.images_json),
    documents: JSON.parse(row.documents_json),
    dealerId: row.dealer_id,
    status: row.status as Car['status'],
    statusHistory: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function parseUserRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as User['role'],
    phone: row.phone,
    email: row.email,
    status: row.status as User['status'],
    createdAt: row.created_at
  }
}

function mapRowToInspection(row: InspectionRow & { car?: CarRow; inspector?: UserRow; auditor?: UserRow }): Inspection {
  const inspection = parseInspectionRow(row)
  if (row.car) {
    inspection.car = parseCarRow(row.car)
  }
  if (row.inspector) {
    inspection.inspector = parseUserRow(row.inspector)
  }
  if (row.auditor) {
    inspection.auditor = parseUserRow(row.auditor)
  }
  return inspection
}

export function calculateOverallScore(inspection: Partial<Inspection>): number {
  let score = 70

  const checkItemDeduction = (item?: InspectionItem) => {
    if (!item) return
    if (item.result === 'abnormal') {
      score -= 50
    } else if (item.result === 'suspicious') {
      score -= 20
    }
  }

  checkItemDeduction(inspection.accident)
  checkItemDeduction(inspection.waterDamage)
  checkItemDeduction(inspection.fireDamage)

  if (inspection.maintenance && inspection.maintenance.length > 0) {
    score += 10
  }

  if (inspection.paintwork && inspection.paintwork.every((p: PaintworkItem) => p.originalPaint && !p.repainted)) {
    score += 10
  }

  if (inspection.roadTest && inspection.roadTest.overall === 'normal') {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}

export async function getInspections(filters?: { inspectorId?: number; status?: string; carId?: number }): Promise<Inspection[]> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.inspectorId !== undefined) {
    conditions.push('i.inspector_id = ?')
    params.push(filters.inspectorId)
  }
  if (filters?.status !== undefined) {
    conditions.push('i.status = ?')
    params.push(filters.status)
  }
  if (filters?.carId !== undefined) {
    conditions.push('i.car_id = ?')
    params.push(filters.carId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `
    SELECT 
      i.*,
      c.id as car_id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color, c.price, c.original_price, c.configuration, c.images_json, c.documents_json, c.dealer_id, c.status as car_status, c.created_at as car_created_at, c.updated_at as car_updated_at,
      iu.id as inspector_id, iu.username as inspector_username, iu.name as inspector_name, iu.role as inspector_role, iu.phone as inspector_phone, iu.email as inspector_email, iu.status as inspector_status, iu.created_at as inspector_created_at,
      au.id as auditor_id, au.username as auditor_username, au.name as auditor_name, au.role as auditor_role, au.phone as auditor_phone, au.email as auditor_email, au.status as auditor_status, au.created_at as auditor_created_at
    FROM inspections i
    LEFT JOIN cars c ON i.car_id = c.id
    LEFT JOIN users iu ON i.inspector_id = iu.id
    LEFT JOIN users au ON i.auditor_id = au.id
    ${whereClause}
    ORDER BY i.created_at DESC
  `

  const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>

  return rows.map(row => {
    const inspectionRow: InspectionRow = {
      id: row.id as number,
      car_id: row.car_id as number,
      inspector_id: row.inspector_id as number,
      accident_json: row.accident_json as string,
      water_damage_json: row.water_damage_json as string,
      fire_damage_json: row.fire_damage_json as string,
      maintenance_json: row.maintenance_json as string,
      paintwork_json: row.paintwork_json as string,
      road_test_json: row.road_test_json as string,
      overall_score: row.overall_score as number,
      overall_comment: row.overall_comment as string,
      status: row.status as string,
      auditor_id: row.auditor_id as number | undefined,
      audit_comment: row.audit_comment as string | undefined,
      audited_at: row.audited_at as string | undefined,
      created_at: row.created_at as string
    }

    const carRow: CarRow = {
      id: row.car_id as number,
      vin: row.vin as string,
      brand: row.brand as string,
      model: row.model as string,
      year: row.year as number,
      month: row.month as number,
      mileage: row.mileage as number,
      color: row.color as string,
      price: row.price as number,
      original_price: row.original_price as number | undefined,
      configuration: row.configuration as string,
      images_json: row.images_json as string,
      documents_json: row.documents_json as string,
      dealer_id: row.dealer_id as number,
      status: row.car_status as string,
      created_at: row.car_created_at as string,
      updated_at: row.car_updated_at as string
    }

    const inspectorRow: UserRow = {
      id: row.inspector_id as number,
      username: row.inspector_username as string,
      name: row.inspector_name as string,
      role: row.inspector_role as string,
      phone: row.inspector_phone as string,
      email: row.inspector_email as string | undefined,
      status: row.inspector_status as string,
      created_at: row.inspector_created_at as string
    }

    const auditorRow = row.auditor_id ? {
      id: row.auditor_id as number,
      username: row.auditor_username as string,
      name: row.auditor_name as string,
      role: row.auditor_role as string,
      phone: row.auditor_phone as string,
      email: row.auditor_email as string | undefined,
      status: row.auditor_status as string,
      created_at: row.auditor_created_at as string
    } : undefined

    return mapRowToInspection({
      ...inspectionRow,
      car: carRow,
      inspector: inspectorRow,
      auditor: auditorRow
    })
  })
}

export async function getInspectionById(id: number): Promise<Inspection | null> {
  const sql = `
    SELECT 
      i.*,
      c.id as car_id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color, c.price, c.original_price, c.configuration, c.images_json, c.documents_json, c.dealer_id, c.status as car_status, c.created_at as car_created_at, c.updated_at as car_updated_at,
      iu.id as inspector_id, iu.username as inspector_username, iu.name as inspector_name, iu.role as inspector_role, iu.phone as inspector_phone, iu.email as inspector_email, iu.status as inspector_status, iu.created_at as inspector_created_at,
      au.id as auditor_id, au.username as auditor_username, au.name as auditor_name, au.role as auditor_role, au.phone as auditor_phone, au.email as auditor_email, au.status as auditor_status, au.created_at as auditor_created_at
    FROM inspections i
    LEFT JOIN cars c ON i.car_id = c.id
    LEFT JOIN users iu ON i.inspector_id = iu.id
    LEFT JOIN users au ON i.auditor_id = au.id
    WHERE i.id = ?
  `

  const row = db.prepare(sql).get(id) as Record<string, unknown> | undefined

  if (!row) return null

  const inspectionRow: InspectionRow = {
    id: row.id as number,
    car_id: row.car_id as number,
    inspector_id: row.inspector_id as number,
    accident_json: row.accident_json as string,
    water_damage_json: row.water_damage_json as string,
    fire_damage_json: row.fire_damage_json as string,
    maintenance_json: row.maintenance_json as string,
    paintwork_json: row.paintwork_json as string,
    road_test_json: row.road_test_json as string,
    overall_score: row.overall_score as number,
    overall_comment: row.overall_comment as string,
    status: row.status as string,
    auditor_id: row.auditor_id as number | undefined,
    audit_comment: row.audit_comment as string | undefined,
    audited_at: row.audited_at as string | undefined,
    created_at: row.created_at as string
  }

  const carRow: CarRow = {
    id: row.car_id as number,
    vin: row.vin as string,
    brand: row.brand as string,
    model: row.model as string,
    year: row.year as number,
    month: row.month as number,
    mileage: row.mileage as number,
    color: row.color as string,
    price: row.price as number,
    original_price: row.original_price as number | undefined,
    configuration: row.configuration as string,
    images_json: row.images_json as string,
    documents_json: row.documents_json as string,
    dealer_id: row.dealer_id as number,
    status: row.car_status as string,
    created_at: row.car_created_at as string,
    updated_at: row.car_updated_at as string
  }

  const inspectorRow: UserRow = {
    id: row.inspector_id as number,
    username: row.inspector_username as string,
    name: row.inspector_name as string,
    role: row.inspector_role as string,
    phone: row.inspector_phone as string,
    email: row.inspector_email as string | undefined,
    status: row.inspector_status as string,
    created_at: row.inspector_created_at as string
  }

  const auditorRow = row.auditor_id ? {
    id: row.auditor_id as number,
    username: row.auditor_username as string,
    name: row.auditor_name as string,
    role: row.auditor_role as string,
    phone: row.auditor_phone as string,
    email: row.auditor_email as string | undefined,
    status: row.auditor_status as string,
    created_at: row.auditor_created_at as string
  } : undefined

  return mapRowToInspection({
    ...inspectionRow,
    car: carRow,
    inspector: inspectorRow,
    auditor: auditorRow
  })
}

export async function createInspection(
  data: Partial<Inspection> & { carId: number; inspectorId: number }
): Promise<Inspection> {
  const existingInspection = get<{ id: number }>(
    'SELECT id FROM inspections WHERE car_id = ?',
    [data.carId]
  )

  if (existingInspection) {
    throw new Error('该车源已有检测报告')
  }

  const car = get<{ id: number; status: string }>(
    'SELECT id, status FROM cars WHERE id = ?',
    [data.carId]
  )

  if (!car) {
    throw new Error('车源不存在')
  }

  if (car.status !== 'pending_inspection') {
    throw new Error('车源状态不是待检测，无法创建检测报告')
  }

  const overallScore = calculateOverallScore(data)

  const transaction = db.transaction(() => {
    const insertResult = run(
      `INSERT INTO inspections (
        car_id, inspector_id, accident_json, water_damage_json, fire_damage_json,
        maintenance_json, paintwork_json, road_test_json, overall_score,
        overall_comment, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.carId,
        data.inspectorId,
        data.accident || { result: 'normal', description: '' },
        data.waterDamage || { result: 'normal', description: '' },
        data.fireDamage || { result: 'normal', description: '' },
        data.maintenance || [],
        data.paintwork || [],
        data.roadTest || { engine: '', transmission: '', brake: '', steering: '', suspension: '', overall: 'normal' },
        overallScore,
        data.overallComment || '',
        'draft'
      ]
    )

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      ['inspecting', data.carId]
    )

    run(
      'INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
      [data.carId, 'pending_inspection', 'inspecting', data.inspectorId, '开始检测']
    )

    return insertResult.lastInsertRowid as number
  })

  const inspectionId = transaction()

  const inspection = await getInspectionById(inspectionId)
  if (!inspection) {
    throw new Error('创建检测报告失败')
  }

  return inspection
}

export async function updateInspection(
  id: number,
  data: Partial<Inspection>,
  operatorId: number
): Promise<Inspection> {
  const existing = get<{ id: number; inspector_id: number; status: string }>(
    'SELECT id, inspector_id, status FROM inspections WHERE id = ?',
    [id]
  )

  if (!existing) {
    throw new Error('检测报告不存在')
  }

  if (existing.status !== 'draft') {
    throw new Error('只能编辑草稿状态的检测报告')
  }

  if (existing.inspector_id !== operatorId) {
    throw new Error('只能编辑自己创建的检测报告')
  }

  const current = await getInspectionById(id)
  if (!current) {
    throw new Error('检测报告不存在')
  }

  const updatedData: Partial<Inspection> = { ...current, ...data }
  const overallScore = calculateOverallScore(updatedData)

  const updateFields: string[] = []
  const updateParams: unknown[] = []

  if (data.accident !== undefined) {
    updateFields.push('accident_json = ?')
    updateParams.push(data.accident)
  }
  if (data.waterDamage !== undefined) {
    updateFields.push('water_damage_json = ?')
    updateParams.push(data.waterDamage)
  }
  if (data.fireDamage !== undefined) {
    updateFields.push('fire_damage_json = ?')
    updateParams.push(data.fireDamage)
  }
  if (data.maintenance !== undefined) {
    updateFields.push('maintenance_json = ?')
    updateParams.push(data.maintenance)
  }
  if (data.paintwork !== undefined) {
    updateFields.push('paintwork_json = ?')
    updateParams.push(data.paintwork)
  }
  if (data.roadTest !== undefined) {
    updateFields.push('road_test_json = ?')
    updateParams.push(data.roadTest)
  }
  if (data.overallComment !== undefined) {
    updateFields.push('overall_comment = ?')
    updateParams.push(data.overallComment)
  }

  updateFields.push('overall_score = ?')
  updateParams.push(overallScore)

  updateParams.push(id)

  run(
    `UPDATE inspections SET ${updateFields.join(', ')} WHERE id = ?`,
    updateParams
  )

  const updated = await getInspectionById(id)
  if (!updated) {
    throw new Error('更新检测报告失败')
  }

  return updated
}

export async function submitInspection(id: number, operatorId: number): Promise<Inspection> {
  const existing = get<{ id: number; car_id: number; inspector_id: number; status: string }>(
    'SELECT id, car_id, inspector_id, status FROM inspections WHERE id = ?',
    [id]
  )

  if (!existing) {
    throw new Error('检测报告不存在')
  }

  if (existing.status !== 'draft') {
    throw new Error('只能提交草稿状态的检测报告')
  }

  if (existing.inspector_id !== operatorId) {
    throw new Error('只能提交自己创建的检测报告')
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE inspections SET status = ? WHERE id = ?',
      ['submitted', id]
    )

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      ['pending_audit', existing.car_id]
    )

    run(
      'INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
      [existing.car_id, 'inspecting', 'pending_audit', operatorId, '检测报告已提交，等待审核']
    )
  })

  transaction()

  const updated = await getInspectionById(id)
  if (!updated) {
    throw new Error('提交检测报告失败')
  }

  return updated
}

export async function auditInspection(
  id: number,
  approved: boolean,
  comment: string,
  auditorId: number
): Promise<Inspection> {
  const existing = get<{ id: number; car_id: number; status: string }>(
    'SELECT id, car_id, status FROM inspections WHERE id = ?',
    [id]
  )

  if (!existing) {
    throw new Error('检测报告不存在')
  }

  if (existing.status !== 'submitted') {
    throw new Error('只能审核已提交的检测报告')
  }

  const newStatus = approved ? 'approved' : 'rejected'
  const carNewStatus = approved ? 'on_sale' : 'inspection_rejected'
  const historyReason = approved ? '检测报告审核通过' : `检测报告审核拒绝：${comment}`

  const transaction = db.transaction(() => {
    run(
      'UPDATE inspections SET status = ?, auditor_id = ?, audit_comment = ?, audited_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, auditorId, comment, id]
    )

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      [carNewStatus, existing.car_id]
    )

    run(
      'INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
      [existing.car_id, 'pending_audit', carNewStatus, auditorId, historyReason]
    )
  })

  transaction()

  const updated = await getInspectionById(id)
  if (!updated) {
    throw new Error('审核检测报告失败')
  }

  return updated
}
