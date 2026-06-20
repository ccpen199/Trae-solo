export function toCaseItem(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    style: row.style,
    houseType: row.house_type,
    area: row.area,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    coverImage: row.cover_image,
    floorPlan: row.floor_plan,
    images: row.images || '[]',
    designerId: row.designer_id,
    designerName: row.designer_name,
    status: row.status,
    watermarkVerified: !!row.watermark_verified,
    createdAt: row.created_at,
  }
}

export function toDesigner(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    title: row.title,
    company: row.company,
    certification: row.certification,
    region: row.region,
    experience: row.experience,
    priceMin: row.price_min,
    priceMax: row.price_max,
    rating: row.rating,
    casesCount: row.cases_count,
    description: row.description,
    styles: Array.isArray(row.styles) ? row.styles : (row.styles ? String(row.styles).split(',') : []),
  }
}

export function toMaterial(row: Record<string, unknown>) {
  return {
    id: row.id,
    caseId: row.case_id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    area: row.area,
  }
}

export function toNode(row: Record<string, unknown>) {
  return {
    id: row.id,
    caseId: row.case_id,
    phase: row.phase,
    description: row.description,
    duration: row.duration,
    order: row.order_num,
  }
}
