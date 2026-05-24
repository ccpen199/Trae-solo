const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole, requireOwnerOrAdmin } = require('../middleware/auth');
const { checkVaccineValidity } = require('../utils/validation');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  let pets;
  if (req.user.role === 'owner') {
    pets = db.prepare('SELECT * FROM pets WHERE owner_id = ?').all(req.user.id);
  } else {
    pets = db.prepare('SELECT * FROM pets').all();
  }
  
  for (const pet of pets) {
    const vaccineCheck = checkVaccineValidity(pet.id);
    pet.vaccine_status = vaccineCheck.valid ? 'valid' : 'expired';
    pet.vaccines = db.prepare('SELECT * FROM vaccines WHERE pet_id = ? ORDER BY expire_date DESC').all(pet.id);
  }
  
  res.json(pets);
});

router.get('/:id', authenticateToken, (req, res) => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id);
  if (!pet) {
    return res.status(404).json({ error: '宠物不存在' });
  }
  
  if (req.user.role === 'owner' && pet.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限访问此宠物' });
  }
  
  const vaccines = db.prepare('SELECT * FROM vaccines WHERE pet_id = ? ORDER BY expire_date DESC').all(pet.id);
  const vaccineCheck = checkVaccineValidity(pet.id);
  
  res.json({
    pet,
    vaccines,
    vaccine_status: vaccineCheck
  });
});

router.post('/', authenticateToken, requireRole('owner', 'admin', 'store'), (req, res) => {
  const { name, species, breed, gender, weight, size, age, is_aggressive, aggression_notes, health_notes } = req.body;
  const ownerId = req.user.role === 'owner' ? req.user.id : req.body.owner_id;
  
  if (!name || !species) {
    return res.status(400).json({ error: '宠物名称和种类不能为空' });
  }
  
  const info = db.prepare(`
    INSERT INTO pets (owner_id, name, species, breed, gender, weight, size, age, is_aggressive, aggression_notes, health_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ownerId, name, species, breed, gender, weight, size, age, is_aggressive ? 1 : 0, aggression_notes, health_notes);
  
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: pet });
});

router.put('/:id', authenticateToken, (req, res) => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id);
  if (!pet) {
    return res.status(404).json({ error: '宠物不存在' });
  }
  
  if (req.user.role === 'owner' && pet.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限修改此宠物' });
  }
  
  const { name, species, breed, gender, weight, size, age, is_aggressive, aggression_notes, health_notes } = req.body;
  
  db.prepare(`
    UPDATE pets SET name = ?, species = ?, breed = ?, gender = ?, weight = ?, size = ?, age = ?, 
    is_aggressive = ?, aggression_notes = ?, health_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, species, breed, gender, weight, size, age, is_aggressive ? 1 : 0, aggression_notes, health_notes, req.params.id);
  
  const updatedPet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updatedPet });
});

router.post('/:id/vaccines', authenticateToken, (req, res) => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id);
  if (!pet) {
    return res.status(404).json({ error: '宠物不存在' });
  }
  
  if (req.user.role === 'owner' && pet.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此宠物' });
  }
  
  const { vaccine_name, vaccine_date, expire_date, certificate_no, hospital, notes } = req.body;
  
  if (!vaccine_name || !vaccine_date || !expire_date) {
    return res.status(400).json({ error: '疫苗名称、接种日期和有效期不能为空' });
  }
  
  const info = db.prepare(`
    INSERT INTO vaccines (pet_id, vaccine_name, vaccine_date, expire_date, certificate_no, hospital, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, vaccine_name, vaccine_date, expire_date, certificate_no, hospital, notes);
  
  const vaccine = db.prepare('SELECT * FROM vaccines WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: vaccine });
});

router.delete('/:id/vaccines/:vid', authenticateToken, (req, res) => {
  const vaccine = db.prepare('SELECT * FROM vaccines WHERE id = ? AND pet_id = ?').get(req.params.vid, req.params.id);
  if (!vaccine) {
    return res.status(404).json({ error: '疫苗记录不存在' });
  }
  
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id);
  if (req.user.role === 'owner' && pet.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限删除此疫苗记录' });
  }
  
  db.prepare('DELETE FROM vaccines WHERE id = ?').run(req.params.vid);
  res.json({ success: true, message: '疫苗记录已删除' });
});

module.exports = router;
