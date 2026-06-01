import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const catalogs = db.prepare(`
    SELECT dc.*, d.name as department_name
    FROM data_catalogs dc
    LEFT JOIN departments d ON dc.department_id = d.id
    ORDER BY dc.created_at DESC
  `).all();
  res.json(catalogs);
});

router.get('/:id', (req, res) => {
  const catalog = db.prepare(`
    SELECT dc.*, d.name as department_name
    FROM data_catalogs dc
    LEFT JOIN departments d ON dc.department_id = d.id
    WHERE dc.id = ?
  `).get(req.params.id);
  
  if (!catalog) {
    return res.status(404).json({ error: '数据目录不存在' });
  }
  
  const fields = db.prepare('SELECT * FROM data_fields WHERE catalog_id = ? ORDER BY id').all(req.params.id);
  const versions = db.prepare(`
    SELECT cv.*, d.name as department_name
    FROM catalog_versions cv
    LEFT JOIN departments d ON cv.department_id = d.id
    WHERE cv.catalog_id = ?
    ORDER BY cv.version DESC
  `).all(req.params.id);
  
  res.json({ ...catalog, fields, versions });
});

router.post('/', (req, res) => {
  const { title, topic, description, update_frequency, department_id, share_level, fields } = req.body;
  
  const insertCatalog = db.prepare(`
    INSERT INTO data_catalogs (title, topic, description, update_frequency, department_id, share_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertField = db.prepare(`
    INSERT INTO data_fields (catalog_id, name, type, description, desensitization_rule, is_required)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertVersion = db.prepare(`
    INSERT INTO catalog_versions (catalog_id, version, title, topic, description, update_frequency, department_id, share_level, change_log)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, '初始版本')
  `);
  
  const tx = db.transaction(() => {
    const result = insertCatalog.run(title, topic, description, update_frequency, department_id, share_level);
    const catalogId = result.lastInsertRowid as number;
    
    if (fields && fields.length > 0) {
      fields.forEach((field: any) => {
        insertField.run(
          catalogId,
          field.name,
          field.type,
          field.description,
          field.desensitization_rule,
          field.is_required ? 1 : 0
        );
      });
    }
    
    insertVersion.run(catalogId, title, topic, description, update_frequency, department_id, share_level);
    
    return catalogId;
  });
  
  try {
    const catalogId = tx();
    res.json({ id: catalogId, message: '创建成功' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { title, topic, description, update_frequency, department_id, share_level, fields, change_log } = req.body;
  const catalogId = parseInt(req.params.id);
  
  const currentCatalog = db.prepare('SELECT * FROM data_catalogs WHERE id = ?').get(catalogId);
  if (!currentCatalog) {
    return res.status(404).json({ error: '数据目录不存在' });
  }
  
  const newVersion = (currentCatalog as any).version + 1;
  
  const updateCatalog = db.prepare(`
    UPDATE data_catalogs
    SET title = ?, topic = ?, description = ?, update_frequency = ?, department_id = ?, share_level = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const deleteFields = db.prepare('DELETE FROM data_fields WHERE catalog_id = ?');
  const insertField = db.prepare(`
    INSERT INTO data_fields (catalog_id, name, type, description, desensitization_rule, is_required)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertVersion = db.prepare(`
    INSERT INTO catalog_versions (catalog_id, version, title, topic, description, update_frequency, department_id, share_level, change_log)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const tx = db.transaction(() => {
    updateCatalog.run(title, topic, description, update_frequency, department_id, share_level, newVersion, catalogId);
    
    deleteFields.run(catalogId);
    if (fields && fields.length > 0) {
      fields.forEach((field: any) => {
        insertField.run(
          catalogId,
          field.name,
          field.type,
          field.description,
          field.desensitization_rule,
          field.is_required ? 1 : 0
        );
      });
    }
    
    insertVersion.run(catalogId, newVersion, title, topic, description, update_frequency, department_id, share_level, change_log || '更新版本');
  });
  
  try {
    tx();
    res.json({ id: catalogId, version: newVersion, message: '更新成功' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
