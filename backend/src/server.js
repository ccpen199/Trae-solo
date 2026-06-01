const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const db = require("./models/db");

const app = express();
const host = "127.0.0.1";
const port = Number(process.env.BACKEND_PORT || 53464);
const frontendPort = Number(process.env.FRONTEND_PORT || 43464);
const allowedOrigins = new Set([
  `http://127.0.0.1:${frontendPort}`,
  `http://localhost:${frontendPort}`,
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));
app.use(express.json({ limit: "2mb" }));

function addAudit(module, action, detail, actor = "张医生") {
  db.prepare(`
    INSERT INTO audit_logs (actor, module, action, detail, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(actor, module, action, detail, "127.0.0.1");
}

function patientSelectSql() {
  return `
    SELECT
      p.*,
      rp.name AS project_name,
      rp.code AS project_code,
      COUNT(t.id) AS task_count
    FROM patients p
    LEFT JOIN research_projects rp ON rp.id = p.project_id
    LEFT JOIN followup_tasks t ON t.patient_id = p.id
  `;
}

function getPatients(where = [], params = []) {
  const sql = [
    patientSelectSql(),
    where.length ? `WHERE ${where.join(" AND ")}` : "",
    "GROUP BY p.id ORDER BY p.id ASC",
  ].join(" ");
  return db.prepare(sql).all(...params);
}

function parseIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
}

function taskSelectSql() {
  return `
    SELECT
      t.id,
      t.patient_id,
      t.project_id,
      t.visit_name,
      t.planned_date,
      t.window_start,
      t.window_end,
      t.status,
      t.completed_at,
      t.notes,
      t.created_at,
      p.code AS patient_code,
      p.name AS patient_name,
      p.diagnosis,
      p.contact_phone,
      rp.name AS project_name
    FROM followup_tasks t
    JOIN patients p ON p.id = t.patient_id
    JOIN research_projects rp ON rp.id = t.project_id
  `;
}

function overviewPayload() {
  const totals = {
    projects: db.prepare("SELECT COUNT(*) AS count FROM research_projects").get().count,
    patients: db.prepare("SELECT COUNT(*) AS count FROM patients").get().count,
    tasks: db.prepare("SELECT COUNT(*) AS count FROM followup_tasks").get().count,
    pendingTasks: db.prepare("SELECT COUNT(*) AS count FROM followup_tasks WHERE status = 'pending'").get().count,
    overdueTasks: db.prepare(`
      SELECT COUNT(*) AS count
      FROM followup_tasks
      WHERE status = 'overdue'
         OR (status = 'pending' AND date(window_end) < date('now'))
    `).get().count,
    openQualityIssues: db.prepare("SELECT COUNT(*) AS count FROM quality_issues WHERE status = 'open'").get().count,
    exports: db.prepare("SELECT COUNT(*) AS count FROM export_jobs").get().count,
  };

  const taskStatus = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM followup_tasks
    GROUP BY status
    ORDER BY status
  `).all();

  const enrollmentStatus = db.prepare(`
    SELECT enrollment_status AS status, COUNT(*) AS count
    FROM patients
    GROUP BY enrollment_status
    ORDER BY enrollment_status
  `).all();

  return { totals, taskStatus, enrollmentStatus };
}

app.get("/api/health", (req, res) => {
  db.prepare("SELECT 1").get();
  res.json({
    ok: true,
    service: "medical-cohort-backend",
    database: "connected",
    host,
    port,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/overview", (req, res, next) => {
  try {
    res.json(overviewPayload());
  } catch (error) {
    next(error);
  }
});

app.get("/api/projects", (req, res, next) => {
  try {
    const projects = db.prepare(`
      SELECT
        rp.*,
        COUNT(DISTINCT p.id) AS patient_count,
        COUNT(DISTINCT t.id) AS task_count
      FROM research_projects rp
      LEFT JOIN patients p ON p.project_id = rp.id
      LEFT JOIN followup_tasks t ON t.project_id = rp.id
      GROUP BY rp.id
      ORDER BY rp.id ASC
    `).all();
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", (req, res, next) => {
  try {
    const {
      code, name, principal_investigator, disease_area, status,
      start_date, target_size, ethics_no, inclusion_criteria,
      exclusion_criteria, followup_plan, target_enrollment,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "code and name are required" });
    }

    const result = db.prepare(`
      INSERT INTO research_projects
        (code, name, principal_investigator, disease_area, status, start_date,
         target_size, ethics_no, inclusion_criteria, exclusion_criteria,
         followup_plan, target_enrollment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code, name, principal_investigator || "", disease_area || "",
      status || "planning", start_date || null, target_size || 0,
      ethics_no || "", inclusion_criteria || "", exclusion_criteria || "",
      followup_plan || "", target_enrollment || 0
    );

    addAudit("项目管理", "创建项目", `创建项目 ${code} - ${name}`);
    const project = db.prepare("SELECT * FROM research_projects WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.get("/api/projects/:id", (req, res, next) => {
  try {
    const project = db.prepare("SELECT * FROM research_projects WHERE id = ?").get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const patientCount = db.prepare("SELECT COUNT(*) AS count FROM patients WHERE project_id = ?").get(req.params.id).count;
    const taskCount = db.prepare("SELECT COUNT(*) AS count FROM followup_tasks WHERE project_id = ?").get(req.params.id).count;
    res.json({ ...project, patient_count: patientCount, task_count: taskCount });
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:id", (req, res, next) => {
  try {
    const existing = db.prepare("SELECT * FROM research_projects WHERE id = ?").get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    const {
      code, name, principal_investigator, disease_area, status,
      start_date, target_size, ethics_no, inclusion_criteria,
      exclusion_criteria, followup_plan, target_enrollment,
    } = req.body;

    db.prepare(`
      UPDATE research_projects
      SET code = ?, name = ?, principal_investigator = ?, disease_area = ?,
          status = ?, start_date = ?, target_size = ?, ethics_no = ?,
          inclusion_criteria = ?, exclusion_criteria = ?,
          followup_plan = ?, target_enrollment = ?
      WHERE id = ?
    `).run(
      code ?? existing.code,
      name ?? existing.name,
      principal_investigator ?? existing.principal_investigator,
      disease_area ?? existing.disease_area,
      status ?? existing.status,
      start_date ?? existing.start_date,
      target_size ?? existing.target_size,
      ethics_no ?? existing.ethics_no,
      inclusion_criteria ?? existing.inclusion_criteria,
      exclusion_criteria ?? existing.exclusion_criteria,
      followup_plan ?? existing.followup_plan,
      target_enrollment ?? existing.target_enrollment,
      req.params.id
    );

    addAudit("项目管理", "更新项目", `更新项目 ${req.params.id}`);
    const project = db.prepare("SELECT * FROM research_projects WHERE id = ?").get(req.params.id);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

app.get("/api/patients", (req, res, next) => {
  try {
    const where = [];
    const params = [];

    if (req.query.project_id) {
      where.push("p.project_id = ?");
      params.push(req.query.project_id);
    }
    if (req.query.enrollment_status) {
      where.push("p.enrollment_status = ?");
      params.push(req.query.enrollment_status);
    }

    res.json(getPatients(where, params));
  } catch (error) {
    next(error);
  }
});

app.get("/api/patients/:id", (req, res, next) => {
  try {
    const patient = getPatients(["p.id = ?"], [req.params.id])[0];
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const tasks = db.prepare(`
      SELECT id, visit_name, planned_date, window_start, window_end, status, completed_at, notes
      FROM followup_tasks
      WHERE patient_id = ?
      ORDER BY date(planned_date) ASC
    `).all(patient.id);
    const issues = db.prepare(`
      SELECT id, issue_type, description, field_name, severity, status, created_at
      FROM quality_issues
      WHERE patient_id = ?
      ORDER BY id ASC
    `).all(patient.id);

    res.json({
      ...patient,
      detail: {
        baseline: patient.baseline_summary,
        lab: patient.lab_summary,
        treatment: patient.treatment_summary,
        surgery: patient.surgery_summary,
        outcome: patient.outcome_summary,
        attachment: patient.attachment_summary,
      },
      tasks,
      qualityIssues: issues,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/screening/candidates", (req, res, next) => {
  try {
    const where = ["p.enrollment_status IN ('screening', 'candidate', 'excluded')"];
    const params = [];

    if (req.query.project_id) {
      where.push("(p.project_id = ? OR p.project_id IS NULL)");
      params.push(req.query.project_id);
    }
    if (req.query.diagnosis) {
      where.push("(p.diagnosis LIKE ? OR p.name LIKE ? OR p.code LIKE ?)");
      const keyword = `%${req.query.diagnosis}%`;
      params.push(keyword, keyword, keyword);
    }
    if (req.query.date_from) {
      where.push("date(p.birth_date) >= date(?)");
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      where.push("date(p.birth_date) <= date(?)");
      params.push(req.query.date_to);
    }

    res.json(getPatients(where, params));
  } catch (error) {
    next(error);
  }
});

app.post("/api/screening/enroll", (req, res, next) => {
  try {
    const patientIds = parseIds(req.body.patientIds);
    const projectId = Number(req.body.projectId);

    if (!patientIds.length || !Number.isInteger(projectId)) {
      return res.status(400).json({ error: "patientIds and projectId are required" });
    }

    const update = db.prepare(`
      UPDATE patients
      SET project_id = ?, screening_status = 'eligible', enrollment_status = 'enrolled',
          enrolled_at = date('now')
      WHERE id = ?
    `);
    const tx = db.transaction((ids) => ids.forEach((id) => update.run(projectId, id)));
    tx(patientIds);
    addAudit("病例筛选", "确认入组", `入组病例 ${patientIds.join(", ")} 至项目 ${projectId}`);

    res.json({ ok: true, patients: getPatients([`p.id IN (${patientIds.map(() => "?").join(",")})`], patientIds) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/screening/exclude", (req, res, next) => {
  try {
    const patientIds = parseIds(req.body.patientIds);
    if (!patientIds.length) {
      return res.status(400).json({ error: "patientIds are required" });
    }

    const placeholders = patientIds.map(() => "?").join(",");
    db.prepare(`
      UPDATE patients
      SET screening_status = 'excluded', enrollment_status = 'excluded'
      WHERE id IN (${placeholders})
    `).run(...patientIds);
    addAudit("病例筛选", "批量排除", `排除病例 ${patientIds.join(", ")}`);

    res.json({ ok: true, patients: getPatients([`p.id IN (${placeholders})`], patientIds) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tasks", (req, res, next) => {
  try {
    const { project_id, status, patient_id } = req.query;
    const params = [];
    const where = [];

    if (project_id) {
      where.push("t.project_id = ?");
      params.push(project_id);
    }
    if (status) {
      where.push("t.status = ?");
      params.push(status);
    }
    if (patient_id) {
      where.push("t.patient_id = ?");
      params.push(patient_id);
    }

    const sql = [
      taskSelectSql(),
      where.length ? `WHERE ${where.join(" AND ")}` : "",
      "ORDER BY date(t.planned_date) ASC, t.id ASC",
    ].join(" ");

    res.json(db.prepare(sql).all(...params));
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", (req, res, next) => {
  try {
    const {
      patient_id, project_id, visit_name, planned_date,
      window_start, window_end, notes = "",
    } = req.body;

    if (!patient_id || !project_id || !visit_name || !planned_date) {
      return res.status(400).json({
        error: "patient_id, project_id, visit_name and planned_date are required",
      });
    }

    const result = db.prepare(`
      INSERT INTO followup_tasks
        (patient_id, project_id, visit_name, planned_date, window_start, window_end, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      patient_id, project_id, visit_name, planned_date,
      window_start || planned_date, window_end || planned_date, notes
    );

    const task = db.prepare(`${taskSelectSql()} WHERE t.id = ?`).get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tasks/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const allowedStatuses = new Set([
      "pending", "completed", "overdue", "cancelled",
      "lost", "dead", "withdrawn", "missed",
    ]);

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: "Unsupported task status" });
    }

    const completedAt = status === "completed" ? new Date().toISOString().slice(0, 10) : null;
    const result = db.prepare(`
      UPDATE followup_tasks
      SET status = ?, completed_at = ?, notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(status, completedAt, notes, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = db.prepare(`${taskSelectSql()} WHERE t.id = ?`).get(id);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.get("/api/quality/issues", (req, res, next) => {
  try {
    const issues = db.prepare(`
      SELECT
        qi.*,
        p.code AS patient_code,
        p.name AS patient_name
      FROM quality_issues qi
      LEFT JOIN patients p ON p.id = qi.patient_id
      ORDER BY
        CASE qi.status WHEN 'open' THEN 0 ELSE 1 END,
        CASE qi.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        qi.id ASC
    `).all();
    res.json(issues);
  } catch (error) {
    next(error);
  }
});

app.post("/api/quality/run", (req, res, next) => {
  try {
    const missingContact = db.prepare("SELECT id FROM patients WHERE contact_phone = '' LIMIT 1").get();
    if (missingContact) {
      db.prepare(`
        INSERT INTO quality_issues (issue_type, description, patient_id, field_name, severity, status)
        VALUES ('缺失值', '病例联系电话为空，需要补录', ?, 'contact_phone', 'high', 'open')
      `).run(missingContact.id);
    }

    const duplicatePatients = db.prepare(`
      SELECT code, COUNT(*) AS cnt FROM patients GROUP BY code HAVING cnt > 1 LIMIT 1
    `).get();
    if (duplicatePatients) {
      db.prepare(`
        INSERT INTO quality_issues (issue_type, description, field_name, severity, status)
        VALUES ('重复病例', '发现重复病例编码: ${duplicatePatients.code}', 'code', 'high', 'open')
      `).run();
    }

    addAudit("数据质控", "执行质控检查", "刷新缺失、逻辑冲突、异常值和重复病例规则");
    res.json({
      ok: true,
      summary: {
        open: db.prepare("SELECT COUNT(*) AS count FROM quality_issues WHERE status = 'open'").get().count,
        reviewed: db.prepare("SELECT COUNT(*) AS count FROM quality_issues WHERE status = 'reviewed'").get().count,
      },
      issues: db.prepare("SELECT * FROM quality_issues ORDER BY id ASC").all(),
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/quality/issues/:id", (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = new Set(["open", "reviewed", "ignored"]);

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: "Unsupported issue status" });
    }

    const result = db.prepare(`
      UPDATE quality_issues SET status = ? WHERE id = ?
    `).run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Quality issue not found" });
    }

    addAudit("数据质控", "更新质控问题", `问题 #${req.params.id} 状态变更为 ${status}`);
    const issue = db.prepare("SELECT * FROM quality_issues WHERE id = ?").get(req.params.id);
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

app.get("/api/exports", (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT ej.*, rp.name AS project_name
      FROM export_jobs ej
      LEFT JOIN research_projects rp ON rp.id = ej.project_id
      ORDER BY datetime(ej.created_at) DESC, ej.id DESC
    `).all();
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/exports", (req, res, next) => {
  try {
    const projectId = req.body.projectId ? Number(req.body.projectId) : null;
    const content = Array.isArray(req.body.content) && req.body.content.length
      ? req.body.content.join(",")
      : "baseline,lab,treatment,followup,outcome";
    const masked = req.body.masked === false ? 0 : 1;
    const where = projectId ? "WHERE project_id = ?" : "";
    const params = projectId ? [projectId] : [];
    const count = db.prepare(`SELECT COUNT(*) AS count FROM patients ${where}`).get(...params).count;
    const filename = `cohort_export_${Date.now()}_${masked ? "masked" : "raw"}.csv`;

    const result = db.prepare(`
      INSERT INTO export_jobs (filename, project_id, record_count, masked, operator, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(filename, projectId, count, masked, "李数据", content);
    addAudit("数据导出", "生成导出文件", `${filename}，记录数 ${count}`, "李数据");

    const job = db.prepare("SELECT * FROM export_jobs WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
});

app.get("/api/audit-logs", (req, res, next) => {
  try {
    const logs = db.prepare(`
      SELECT *
      FROM audit_logs
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 80
    `).all();
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

app.get("/api/search", (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    const like = `%${query}%`;
    const patientWhere = query
      ? "(p.name LIKE ? OR p.code LIKE ? OR p.diagnosis LIKE ?)"
      : "1 = 1";
    const patientParams = query ? [like, like, like] : [];
    const projectWhere = query
      ? "(code LIKE ? OR name LIKE ? OR disease_area LIKE ? OR principal_investigator LIKE ?)"
      : "1 = 1";
    const projectParams = query ? [like, like, like, like] : [];

    const patients = getPatients([patientWhere], patientParams).slice(0, 10);
    const projects = db.prepare(`
      SELECT *
      FROM research_projects
      WHERE ${projectWhere}
      ORDER BY id ASC
      LIMIT 10
    `).all(...projectParams);

    addAudit("全局搜索", "搜索", query || "空关键词");
    res.json({ query, patients, projects, total: patients.length + projects.length });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/stats", (req, res, next) => {
  try {
    const overview = overviewPayload();
    res.json({
      ok: true,
      users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
      ...overview.totals,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/dashboard", (req, res, next) => {
  try {
    res.json({
      ok: true,
      overview: overviewPayload(),
      recentExports: db.prepare(`
        SELECT filename, record_count, masked, operator, created_at
        FROM export_jobs
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT 5
      `).all(),
      recentAuditLogs: db.prepare(`
        SELECT actor, module, action, detail, created_at
        FROM audit_logs
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT 8
      `).all(),
      openQualityIssues: db.prepare(`
        SELECT issue_type, description, severity, status
        FROM quality_issues
        WHERE status = 'open'
        ORDER BY id ASC
        LIMIT 8
      `).all(),
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

const server = app.listen(port, host, () => {
  console.log(`medical-cohort-backend listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  console.error(`backend failed to listen on ${host}:${port}`, error);
  process.exit(1);
});
