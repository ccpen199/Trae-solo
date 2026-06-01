const express = require("express");
const db = require("../models/db");

const router = express.Router();

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

router.get("/tasks", (req, res, next) => {
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

router.post("/tasks", (req, res, next) => {
  try {
    const {
      patient_id,
      project_id,
      visit_name,
      planned_date,
      window_start,
      window_end,
      notes = "",
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
      patient_id,
      project_id,
      visit_name,
      planned_date,
      window_start || planned_date,
      window_end || planned_date,
      notes
    );

    const task = db.prepare(`${taskSelectSql()} WHERE t.id = ?`).get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.patch("/tasks/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const allowedStatuses = new Set([
      "pending",
      "completed",
      "overdue",
      "cancelled",
      "lost",
      "dead",
      "withdrawn",
      "missed",
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

module.exports = router;
