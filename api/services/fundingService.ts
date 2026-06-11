import db from '../database/index.js';
import type { FundingRecord, FundingQueryParams, PageResponse, Student } from '@shared/types';

function generateVoucherCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VC${timestamp}${random}`;
}

export const fundingService = {
  getList(params: FundingQueryParams, schoolIds: number[]): PageResponse<FundingRecord> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const whereConditions: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (schoolIds.length > 0) {
      whereConditions.push(`fr.school_id IN (${schoolIds.map(() => '?').join(', ')})`);
      queryParams.push(...schoolIds);
    }

    if (params.schoolId) {
      whereConditions.push('fr.school_id = ?');
      queryParams.push(params.schoolId);
    }

    if (params.studentId) {
      whereConditions.push('fr.student_id = ?');
      queryParams.push(params.studentId);
    }

    if (params.status) {
      whereConditions.push('fr.status = ?');
      queryParams.push(params.status);
    }

    if (params.batchNo) {
      whereConditions.push('fr.batch_no = ?');
      queryParams.push(params.batchNo);
    }

    if (params.keyword) {
      whereConditions.push('fr.student_name LIKE ?');
      queryParams.push(`%${params.keyword}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM funding_records fr
      ${whereClause}
    `;

    const listSql = `
      SELECT 
        fr.id,
        fr.student_id,
        fr.student_name,
        fr.school_id,
        s.name as school_name,
        fr.funding_type,
        fr.amount,
        fr.batch_no,
        fr.status,
        fr.apply_time,
        fr.approve_time,
        fr.distribute_time,
        fr.receive_time,
        fr.voucher_code,
        st.class as class_name
      FROM funding_records fr
      LEFT JOIN schools s ON fr.school_id = s.id
      LEFT JOIN students st ON fr.student_id = st.id
      ${whereClause}
      ORDER BY fr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...queryParams) as { total: number };
    const list = db.prepare(listSql).all(...queryParams, pageSize, offset) as any[];

    const formattedList: FundingRecord[] = list.map(item => ({
      id: item.id,
      studentId: item.student_id,
      studentName: item.student_name,
      schoolId: item.school_id,
      schoolName: item.school_name,
      fundingType: item.funding_type,
      amount: item.amount,
      batchNo: item.batch_no,
      status: item.status,
      applyTime: item.apply_time,
      approveTime: item.approve_time,
      distributeTime: item.distribute_time,
      receiveTime: item.receive_time,
      voucherCode: item.voucher_code,
      className: item.class_name,
    }));

    return {
      list: formattedList,
      total: countResult.total,
      page,
      pageSize,
    };
  },

  compareLists(schoolId: number): {
    inBoth: Student[];
    onlyInSchool: Student[];
    onlyInPoverty: Student[];
    schoolTotal: number;
    povertyTotal: number;
  } {
    const schoolStudents = db.prepare(`
      SELECT 
        id,
        student_no,
        name,
        gender,
        grade,
        class,
        school_id,
        id_card,
        phone,
        is_poverty,
        is_funding_eligible,
        status,
        created_at,
        updated_at
      FROM students 
      WHERE school_id = ? AND status = 'active'
    `).all(schoolId) as any[];

    const povertyStudents = schoolStudents.filter((s: any) => s.is_poverty === 1);

    const schoolIdMap = new Map(schoolStudents.map((s: any) => [s.id_card, s]));
    const povertyIdMap = new Map(povertyStudents.map((s: any) => [s.id_card, s]));

    const inBoth: any[] = [];
    const onlyInSchool: any[] = [];
    const onlyInPoverty: any[] = [];

    for (const student of schoolStudents) {
      if (povertyIdMap.has(student.id_card)) {
        inBoth.push(student);
      } else {
        onlyInSchool.push(student);
      }
    }

    for (const student of povertyStudents) {
      if (!schoolIdMap.has(student.id_card)) {
        onlyInPoverty.push(student);
      }
    }

    const formatStudent = (item: any): Student => ({
      id: item.id,
      studentNo: item.student_no,
      name: item.name,
      gender: item.gender,
      grade: item.grade,
      className: item.class,
      schoolId: item.school_id,
      idCard: item.id_card,
      phone: item.phone,
      isPoverty: item.is_poverty === 1,
      isFundingEligible: item.is_funding_eligible === 1,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });

    return {
      inBoth: inBoth.map(formatStudent),
      onlyInSchool: onlyInSchool.map(formatStudent),
      onlyInPoverty: onlyInPoverty.map(formatStudent),
      schoolTotal: schoolStudents.length,
      povertyTotal: povertyStudents.length,
    };
  },

  getDistribution(params: FundingQueryParams, schoolIds: number[]): PageResponse<FundingRecord> {
    return this.getList(params, schoolIds);
  },

  updateDistributionStatus(id: number, status: string, schoolIds: number[]): FundingRecord | null {
    const existing = db.prepare(`
      SELECT id, school_id FROM funding_records WHERE id = ?
    `).get(id) as { id: number; school_id: number } | undefined;

    if (!existing) {
      return null;
    }

    if (schoolIds.length > 0 && !schoolIds.includes(existing.school_id)) {
      return null;
    }

    const updateFields: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateParams: (string | number)[] = [status];

    const now = new Date().toISOString();
    if (status === 'approved') {
      updateFields.push('approve_time = ?');
      updateParams.push(now);
    } else if (status === 'distributed') {
      updateFields.push('distribute_time = ?');
      updateParams.push(now);
    } else if (status === 'received') {
      updateFields.push('receive_time = ?');
      updateParams.push(now);
    }

    updateParams.push(id);

    const sql = `
      UPDATE funding_records
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    db.prepare(sql).run(...updateParams);

    const result = db.prepare(`
      SELECT 
        fr.id,
        fr.student_id,
        fr.student_name,
        fr.school_id,
        s.name as school_name,
        fr.funding_type,
        fr.amount,
        fr.batch_no,
        fr.status,
        fr.apply_time,
        fr.approve_time,
        fr.distribute_time,
        fr.receive_time,
        fr.voucher_code,
        st.class as class_name
      FROM funding_records fr
      LEFT JOIN schools s ON fr.school_id = s.id
      LEFT JOIN students st ON fr.student_id = st.id
      WHERE fr.id = ?
    `).get(id) as any;

    if (!result) return null;

    return {
      id: result.id,
      studentId: result.student_id,
      studentName: result.student_name,
      schoolId: result.school_id,
      schoolName: result.school_name,
      fundingType: result.funding_type,
      amount: result.amount,
      batchNo: result.batch_no,
      status: result.status,
      applyTime: result.apply_time,
      approveTime: result.approve_time,
      distributeTime: result.distribute_time,
      receiveTime: result.receive_time,
      voucherCode: result.voucher_code,
      className: result.class_name,
    };
  },

  generateVoucher(id: number, schoolIds: number[]): { voucherCode: string; record: FundingRecord } | null {
    const existing = db.prepare(`
      SELECT id, school_id, voucher_code FROM funding_records WHERE id = ?
    `).get(id) as { id: number; school_id: number; voucher_code: string | null } | undefined;

    if (!existing) {
      return null;
    }

    if (schoolIds.length > 0 && !schoolIds.includes(existing.school_id)) {
      return null;
    }

    const voucherCode = existing.voucher_code || generateVoucherCode();

    db.prepare(`
      UPDATE funding_records
      SET voucher_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(voucherCode, id);

    const result = db.prepare(`
      SELECT 
        fr.id,
        fr.student_id,
        fr.student_name,
        fr.school_id,
        s.name as school_name,
        fr.funding_type,
        fr.amount,
        fr.batch_no,
        fr.status,
        fr.apply_time,
        fr.approve_time,
        fr.distribute_time,
        fr.receive_time,
        fr.voucher_code,
        st.class as class_name
      FROM funding_records fr
      LEFT JOIN schools s ON fr.school_id = s.id
      LEFT JOIN students st ON fr.student_id = st.id
      WHERE fr.id = ?
    `).get(id) as any;

    if (!result) return null;

    const record: FundingRecord = {
      id: result.id,
      studentId: result.student_id,
      studentName: result.student_name,
      schoolId: result.school_id,
      schoolName: result.school_name,
      fundingType: result.funding_type,
      amount: result.amount,
      batchNo: result.batch_no,
      status: result.status,
      applyTime: result.apply_time,
      approveTime: result.approve_time,
      distributeTime: result.distribute_time,
      receiveTime: result.receive_time,
      voucherCode: result.voucher_code,
      className: result.class_name,
    };

    return { voucherCode, record };
  },
};

export default fundingService;
