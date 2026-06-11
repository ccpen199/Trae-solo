import db from "../db/index.js";
import type {
  HealthArchive,
  HISDepartment,
  HISDoctor,
  HISAppointment,
  DataAuthorization,
} from "../../shared/types.js";
import { reversePrivacyFilter } from "../utils/privacy.js";
import { healthDataService } from "./healthDataService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function rowToArchive(row: unknown): HealthArchive {
  const r = reversePrivacyFilter(row) as {
    id: string;
    user_id: string;
    date_start: string;
    date_end: string;
    dataTypes?: string[];
    format: "json" | "pdf";
    standard: string;
    generated_at: string;
    file_path: string;
    download_url: string;
    status: "generating" | "completed" | "failed";
  };
  return {
    id: r.id,
    userId: r.user_id,
    dateStart: r.date_start,
    dateEnd: r.date_end,
    dataTypes: r.dataTypes || [],
    format: r.format,
    standard: r.standard,
    generatedAt: r.generated_at,
    filePath: r.file_path,
    downloadUrl: r.download_url,
    status: r.status,
  };
}

function rowToDepartment(row: unknown): HISDepartment {
  const r = row as { id: string; name: string; description: string };
  return { id: r.id, name: r.name, description: r.description };
}

function rowToDoctor(row: unknown): HISDoctor {
  const r = reversePrivacyFilter(row) as {
    id: string;
    name: string;
    department: string;
    department_id: string;
    title: string;
    availableSlots?: string[];
  };
  return {
    id: r.id,
    name: r.name,
    department: r.department,
    departmentId: r.department_id,
    title: r.title,
    availableSlots: r.availableSlots || [],
  };
}

function rowToAppointment(row: unknown): HISAppointment {
  const r = row as {
    id: string;
    user_id: string;
    hospital_id: string;
    department_id: string;
    doctor_id: string;
    date: string;
    time_slot: string;
    patient_name: string;
    patient_phone: string;
    status: "pending" | "confirmed" | "cancelled";
    created_at: string;
  };
  return {
    id: r.id,
    hospitalId: r.hospital_id,
    departmentId: r.department_id,
    doctorId: r.doctor_id,
    date: r.date,
    timeSlot: r.time_slot,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    status: r.status,
    createdAt: r.created_at,
  };
}

function rowToAuthorization(row: unknown): DataAuthorization {
  const r = reversePrivacyFilter(row) as {
    id: string;
    user_id: string;
    target_org: string;
    target_org_name: string;
    scope?: string[];
    scope_description: string;
    expires_at: string;
    created_at: string;
    revoked: number;
  };
  return {
    id: r.id,
    userId: r.user_id,
    targetOrg: r.target_org,
    targetOrgName: r.target_org_name,
    scope: r.scope || [],
    scopeDescription: r.scope_description,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    revoked: r.revoked === 1,
  };
}

export class ArchiveService {
  getArchives(userId: string): HealthArchive[] {
    const stmt = db.prepare(`
      SELECT * FROM health_archives WHERE user_id = ? ORDER BY generated_at DESC
    `);
    const rows = stmt.all(userId) as unknown[];
    return rows.map(rowToArchive);
  }

  async generateArchive(
    userId: string,
    dateStart: string,
    dateEnd: string,
    dataTypes: string[],
    format: "json" | "pdf" = "json"
  ): Promise<HealthArchive> {
    const id = generateId();
    const archiveDir = path.join(__dirname, "..", "..", "archives");
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const filePath = path.join(archiveDir, `archive-${id}.${format}`);
    const downloadUrl = `/api/archives/${id}/download`;

    const archiveRecordStmt = db.prepare(`
      INSERT INTO health_archives (id, user_id, date_start, date_end, data_types_json, format, standard, generated_at, file_path, download_url, status)
      VALUES (?, ?, ?, ?, ?, ?, '移动健康终端设备数据交互规范', datetime('now'), ?, ?, 'generating')
    `);
    archiveRecordStmt.run(
      id,
      userId,
      dateStart,
      dateEnd,
      JSON.stringify(dataTypes),
      format,
      filePath,
      downloadUrl
    );

    const vitals = dataTypes.includes("vitals")
      ? healthDataService.getVitalRecords(userId, 365 * 2)
      : [];
    const sleeps = dataTypes.includes("sleep")
      ? healthDataService.getSleepRecords(userId, 365 * 2)
      : [];
    const exercises = dataTypes.includes("exercise")
      ? healthDataService.getExerciseRecords(userId, 365 * 2)
      : [];
    const alerts = dataTypes.includes("alerts")
      ? db
          .prepare(`SELECT * FROM alerts WHERE user_id = ? AND started_at >= ? AND started_at <= ?`)
          .all(userId, dateStart, dateEnd)
      : [];

    const standardArchive = {
      header: {
        version: "1.0",
        standard: "移动健康终端设备数据交互规范",
        generatedAt: new Date().toISOString(),
        userId: userId,
        dateRange: { start: dateStart, end: dateEnd },
        dataTypes,
      },
      userInformation: {
        name: "***",
        age: "***",
        gender: "***",
      },
      deviceInformation: {
        manufacturer: "Multiple",
        model: "Various",
        firmwareVersion: "Multiple",
      },
      physiologicalData: {
        vitalSigns: vitals.map((v) => ({
          measurementTime: v.timestamp,
          heartRate: v.heartRate,
          heartRateVariability: v.hrv,
          bloodOxygen: v.bloodOxygen,
          stressLevel: v.stressIndex,
          restingHeartRate: v.restingHeartRate,
        })),
        sleepData: sleeps.map((s) => ({
          date: s.date,
          totalDuration: s.totalTime,
          deepSleepDuration: s.deepSleep,
          lightSleepDuration: s.lightSleep,
          remSleepDuration: s.remSleep,
          awakeDuration: s.awakeTime,
          qualityScore: s.qualityScore,
          noiseLevel: s.noiseLevelAvg,
        })),
        exerciseData: exercises.map((e) => ({
          startTime: e.startTime,
          duration: e.duration,
          exerciseType: e.type,
          distance: e.distance,
          calories: e.calories,
          avgHeartRate: e.avgHeartRate,
          maxHeartRate: e.maxHeartRate,
        })),
      },
      alertData: alerts.map((a: unknown) => ({
        type: (a as { type: string }).type,
        severity: (a as { severity: string }).severity,
        startTime: (a as { started_at: string }).started_at,
        description: (a as { description: string }).description,
      })),
      healthAssessment: {
        overallScore: healthDataService.calculateHealthScore(userId).overall,
        assessmentDate: new Date().toISOString(),
      },
      signature: {
        algorithm: "SHA256",
        value: "***",
        timestamp: new Date().toISOString(),
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(standardArchive, null, 2));

    db.prepare(`UPDATE health_archives SET status = 'completed' WHERE id = ?`).run(
      id
    );

    return this.getArchives(userId).find((a) => a.id === id) as HealthArchive;
  }

  getArchiveFilePath(archiveId: string): string | null {
    const row = db
      .prepare(`SELECT file_path FROM health_archives WHERE id = ?`)
      .get(archiveId) as { file_path: string } | undefined;
    return row?.file_path || null;
  }
}

export class HISService {
  getDepartments(): HISDepartment[] {
    const stmt = db.prepare(`SELECT * FROM his_departments`);
    const rows = stmt.all() as unknown[];
    if (rows.length === 0) {
      const depts = [
        { id: "dept-001", name: "心血管内科", description: "诊治心血管系统相关疾病" },
        { id: "dept-002", name: "呼吸内科", description: "诊治呼吸系统相关疾病" },
        { id: "dept-003", name: "神经内科", description: "诊治神经系统相关疾病" },
        { id: "dept-004", name: "内分泌科", description: "诊治内分泌代谢相关疾病" },
        { id: "dept-005", name: "全科医学科", description: "全科医疗与健康咨询" },
      ];
      for (const d of depts) {
        db.prepare(`INSERT OR IGNORE INTO his_departments VALUES (?, ?, ?)`).run(
          d.id,
          d.name,
          d.description
        );
      }
      return depts;
    }
    return rows.map(rowToDepartment);
  }

  getDoctors(departmentId?: string): HISDoctor[] {
    let sql = `SELECT * FROM his_doctors`;
    const params: string[] = [];

    if (departmentId) {
      sql += ` WHERE department_id = ?`;
      params.push(departmentId);
    }

    const rows = db.prepare(sql).all(...params) as unknown[];
    if (rows.length === 0) {
      const doctors = [
        {
          id: "doc-001",
          name: "张医生",
          department: "心血管内科",
          departmentId: "dept-001",
          title: "主任医师",
          availableSlots: [
            "2026-06-12 上午 09:00",
            "2026-06-12 上午 10:00",
            "2026-06-13 下午 14:00",
          ],
        },
        {
          id: "doc-002",
          name: "李医生",
          department: "心血管内科",
          departmentId: "dept-001",
          title: "副主任医师",
          availableSlots: ["2026-06-12 下午 14:30", "2026-06-14 上午 09:30"],
        },
        {
          id: "doc-003",
          name: "王医生",
          department: "全科医学科",
          departmentId: "dept-005",
          title: "主治医师",
          availableSlots: [
            "2026-06-11 下午 15:00",
            "2026-06-12 上午 11:00",
            "2026-06-13 上午 09:00",
          ],
        },
      ];
      for (const d of doctors) {
        db.prepare(
          `INSERT OR IGNORE INTO his_doctors (id, name, department, department_id, title, available_slots_json) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(d.id, d.name, d.department, d.departmentId, d.title, JSON.stringify(d.availableSlots));
      }
      return doctors.filter((d) => !departmentId || d.departmentId === departmentId);
    }
    return rows.map(rowToDoctor);
  }

  createAppointment(
    userId: string,
    appointment: Omit<HISAppointment, "id" | "createdAt" | "status">
  ): HISAppointment {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO his_appointments (id, user_id, hospital_id, department_id, doctor_id, date, time_slot, patient_name, patient_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `);
    stmt.run(
      id,
      userId,
      appointment.hospitalId,
      appointment.departmentId,
      appointment.doctorId,
      appointment.date,
      appointment.timeSlot,
      appointment.patientName,
      appointment.patientPhone
    );
    return this.getAppointments(userId).find((a) => a.id === id) as HISAppointment;
  }

  getAppointments(userId: string): HISAppointment[] {
    const stmt = db.prepare(`
      SELECT * FROM his_appointments WHERE user_id = ? ORDER BY date DESC, time_slot
    `);
    const rows = stmt.all(userId) as unknown[];
    return rows.map(rowToAppointment);
  }

  cancelAppointment(userId: string, appointmentId: string): boolean {
    const result = db
      .prepare(
        `UPDATE his_appointments SET status = 'cancelled' WHERE id = ? AND user_id = ?`
      )
      .run(appointmentId, userId);
    return result.changes > 0;
  }
}

export class AuthorizationService {
  getAuthorizations(userId: string): DataAuthorization[] {
    const stmt = db.prepare(`
      SELECT * FROM data_authorizations WHERE user_id = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(userId) as unknown[];
    return rows.map(rowToAuthorization);
  }

  createAuthorization(
    userId: string,
    auth: Omit<DataAuthorization, "id" | "userId" | "createdAt" | "revoked">
  ): DataAuthorization {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO data_authorizations (id, user_id, target_org, target_org_name, scope_json, scope_description, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      auth.targetOrg,
      auth.targetOrgName,
      JSON.stringify(auth.scope),
      auth.scopeDescription,
      auth.expiresAt
    );
    return this.getAuthorizations(userId).find((a) => a.id === id) as DataAuthorization;
  }

  revokeAuthorization(userId: string, authId: string): boolean {
    const result = db
      .prepare(`UPDATE data_authorizations SET revoked = 1 WHERE id = ? AND user_id = ?`)
      .run(authId, userId);
    return result.changes > 0;
  }
}

export const archiveService = new ArchiveService();
export const hisService = new HISService();
export const authorizationService = new AuthorizationService();
