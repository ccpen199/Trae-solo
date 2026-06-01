const db = require("../db");
const { success, error, pagination } = require("../utils/response");

const createService = (req, res) => {
  const { name, description, indications, contraindications, supplies, category, risk_level, duration, price, requires_approval, required_qualifications } = req.body;
  if (!name || !category || !risk_level || !duration || !price) {
    return res.status(400).json(error("缺少必要参数"));
  }
  const result = db.prepare("INSERT INTO services (name, description, indications, contraindications, supplies, category, risk_level, duration, price, requires_approval, required_qualifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(name, description, indications, contraindications, supplies, category, risk_level, duration, price, requires_approval || 0, required_qualifications || null);
  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(success(service, "创建成功"));
};

const getServices = (req, res) => {
  const { page = 1, pageSize = 10, risk_level, category } = req.query;
  let sql = "SELECT * FROM services WHERE 1=1";
  const params = [];
  if (risk_level) { sql += " AND risk_level = ?"; params.push(risk_level); }
  if (category) { sql += " AND category = ?"; params.push(category); }
  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as count");
  const total = db.prepare(countSql).get(...params).count;
  const offset = (page - 1) * pageSize;
  sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(parseInt(pageSize), offset);
  const services = db.prepare(sql).all(...params);
  res.json(pagination(services, total, parseInt(page), parseInt(pageSize)));
};

const getServiceById = (req, res) => {
  const { id } = req.params;
  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
  if (!service) return res.status(404).json(error("服务项目不存在"));
  res.json(success(service, "查询成功"));
};

const updateService = (req, res) => {
  const { id } = req.params;
  const { name, description, indications, contraindications, supplies, category, risk_level, duration, price, requires_approval, required_qualifications } = req.body;
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
  if (!existing) return res.status(404).json(error("服务项目不存在"));
  db.prepare("UPDATE services SET name = ?, description = ?, indications = ?, contraindications = ?, supplies = ?, category = ?, risk_level = ?, duration = ?, price = ?, requires_approval = ?, required_qualifications = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(name || existing.name, description !== undefined ? description : existing.description, indications !== undefined ? indications : existing.indications, contraindications !== undefined ? contraindications : existing.contraindications, supplies !== undefined ? supplies : existing.supplies, category || existing.category, risk_level || existing.risk_level, duration || existing.duration, price || existing.price, requires_approval !== undefined ? requires_approval : existing.requires_approval, required_qualifications !== undefined ? required_qualifications : existing.required_qualifications, id);
  const updated = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
  res.json(success(updated, "更新成功"));
};

const deleteService = (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
  if (!existing) return res.status(404).json(error("服务项目不存在"));
  db.prepare("DELETE FROM services WHERE id = ?").run(id);
  res.json(success(null, "删除成功"));
};

module.exports = { createService, getServices, getServiceById, updateService, deleteService };
