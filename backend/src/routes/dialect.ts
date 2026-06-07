import { Router } from 'express';
import { getAsync, allAsync, runAsync } from '../database/init';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { gridCode, limit } = req.query;
    
    let query = 'SELECT * FROM dialect_search WHERE 1=1';
    const params: any[] = [];
    
    if (gridCode) {
      query += ' AND grid_code = ?';
      params.push(gridCode);
    }
    
    query += ' ORDER BY search_count DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(Number(limit));
    }
    
    const dialects = await allAsync(query, params);
    res.json({ success: true, data: dialects });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取方言词条失败' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { keyword, gridCode } = req.query;
    
    const dialects = await allAsync(`
      SELECT * FROM dialect_search
      WHERE keyword LIKE ? OR standard_text LIKE ? OR pinyin LIKE ?
      ${gridCode ? 'AND grid_code = ?' : ''}
      ORDER BY search_count DESC
      LIMIT 20
    `, gridCode 
      ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, gridCode]
      : [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
    
    res.json({ success: true, data: dialects });
  } catch (error) {
    res.status(500).json({ success: false, error: '搜索失败' });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const { gridCode, limit = 10 } = req.query;
    
    const dialects = await allAsync(`
      SELECT * FROM dialect_search
      ${gridCode ? 'WHERE grid_code = ?' : ''}
      ORDER BY search_count DESC
      LIMIT ?
    `, gridCode ? [gridCode, Number(limit)] : [Number(limit)]);
    
    res.json({ success: true, data: dialects });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热词失败' });
  }
});

router.post('/:id/increment', async (req, res) => {
  try {
    await runAsync('UPDATE dialect_search SET search_count = search_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { keyword, pinyin, dialect, standardText, type, gridCode } = req.body;
    
    const result = await runAsync(`
      INSERT INTO dialect_search (keyword, pinyin, dialect, standard_text, type, grid_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [keyword, pinyin, dialect, standardText, type, gridCode]);
    
    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加失败' });
  }
});

export default router;
