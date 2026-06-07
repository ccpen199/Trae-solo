import db from '../db/database.ts';

export function requiresVerification(insuranceLevel: string, insuranceValue: number): boolean {
  return insuranceLevel === 'premium' || insuranceValue > 1000;
}

export function isVerificationComplete(waybillId: number): boolean {
  const verification = db.prepare(`
    SELECT * FROM insurance_verifications WHERE waybill_id = ?
  `).get(waybillId) as any;

  if (!verification) return false;
  return verification.id_verified === 1 && verification.photo_path !== null;
}

export function canTransitionToSigned(waybillId: number): { allowed: boolean; reason?: string } {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId) as any;

  if (!waybill) {
    return { allowed: false, reason: 'Waybill not found' };
  }

  if (requiresVerification(waybill.insurance_level, waybill.insurance_value)) {
    if (!isVerificationComplete(waybillId)) {
      return { allowed: false, reason: 'Insurance verification required (photo + ID) before signing' };
    }
  }

  return { allowed: true };
}

export function submitVerification(
  waybillId: number,
  photoPath: string | null,
  idVerified: boolean,
  verifierNote?: string
) {
  const existing = db.prepare('SELECT * FROM insurance_verifications WHERE waybill_id = ?').get(waybillId);

  if (existing) {
    db.prepare(`
      UPDATE insurance_verifications SET photo_path = ?, id_verified = ?, verifier_note = ?
      WHERE waybill_id = ?
    `).run(photoPath, idVerified ? 1 : 0, verifierNote || null, waybillId);
  } else {
    db.prepare(`
      INSERT INTO insurance_verifications (waybill_id, photo_path, id_verified, verifier_note)
      VALUES (?, ?, ?, ?)
    `).run(waybillId, photoPath, idVerified ? 1 : 0, verifierNote || null);
  }

  return db.prepare('SELECT * FROM insurance_verifications WHERE waybill_id = ?').get(waybillId);
}

export function getVerification(waybillId: number) {
  const verification = db.prepare(`
    SELECT iv.*, w.order_no, w.insurance_level, w.insurance_value
    FROM insurance_verifications iv
    LEFT JOIN waybills w ON iv.waybill_id = w.id
    WHERE iv.waybill_id = ?
  `).get(waybillId);

  if (!verification) {
    const waybill = db.prepare('SELECT order_no, insurance_level, insurance_value FROM waybills WHERE id = ?').get(waybillId);
    if (!waybill) return null;
    return {
      ...waybill,
      photo_path: null,
      id_verified: 0,
      verifier_note: null,
      requires_verification: requiresVerification(waybill.insurance_level as string, waybill.insurance_value as number),
    };
  }

  return {
    ...verification,
    requires_verification: requiresVerification((verification as any).insurance_level, (verification as any).insurance_value),
  };
}
