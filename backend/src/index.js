require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 48441;

app.use(cors({
  origin: [`http://localhost:${process.env.FRONTEND_PORT || 48442}`],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

initDatabase();

function generateDefaultData() {
  const labels = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月'];
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  return labels.map((label, i) => ({
    label,
    value: Math.floor(Math.random() * 80) + 20,
    color: colors[i % colors.length],
    sort_order: i
  }));
}

app.get('/api/charts', (req, res) => {
  try {
    const charts = db.prepare(`
      SELECT c.*, COUNT(cd.id) as data_count 
      FROM charts c 
      LEFT JOIN chart_data cd ON c.id = cd.chart_id 
      GROUP BY c.id 
      ORDER BY c.updated_at DESC
    `).all();
    
    res.json({
      success: true,
      data: charts.map(c => ({
        ...c,
        settings: JSON.parse(c.settings || '{}'),
        style: JSON.parse(c.style || '{}')
      }))
    });
  } catch (error) {
    console.error('Get charts error:', error);
    res.status(500).json({ success: false, message: '获取图表列表失败' });
  }
});

app.get('/api/charts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const chart = db.prepare('SELECT * FROM charts WHERE id = ?').get(id);
    
    if (!chart) {
      return res.status(404).json({ success: false, message: '图表不存在' });
    }

    const data = db.prepare('SELECT * FROM chart_data WHERE chart_id = ? ORDER BY sort_order').all(id);
    const axis = db.prepare('SELECT * FROM axis_settings WHERE chart_id = ?').get(id);

    res.json({
      success: true,
      data: {
        ...chart,
        settings: JSON.parse(chart.settings || '{}'),
        style: JSON.parse(chart.style || '{}'),
        data_points: data,
        axis_settings: axis || {
          x_title: 'X轴',
          y_title: 'Y轴',
          y_min: 0,
          y_max: 100,
          y_interval: 20,
          show_grid: 1,
          show_align_line: 1
        }
      }
    });
  } catch (error) {
    console.error('Get chart error:', error);
    res.status(500).json({ success: false, message: '获取图表详情失败' });
  }
});

app.post('/api/charts', (req, res) => {
  try {
    const { title = '未命名图表', type = 'bar' } = req.body;
    
    const insertChart = db.prepare('INSERT INTO charts (title, type) VALUES (?, ?)');
    const result = insertChart.run(title, type);
    const chartId = result.lastInsertRowid;

    const defaultData = generateDefaultData();
    const insertData = db.prepare('INSERT INTO chart_data (chart_id, label, value, color, sort_order) VALUES (?, ?, ?, ?, ?)');
    defaultData.forEach(d => insertData.run(chartId, d.label, d.value, d.color, d.sort_order));

    db.prepare(`
      INSERT INTO axis_settings (chart_id, x_title, y_title, y_min, y_max, y_interval, show_grid, show_align_line)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(chartId, 'X轴', 'Y轴', 0, 100, 20, 1, 1);

    res.json({ success: true, data: { id: chartId } });
  } catch (error) {
    console.error('Create chart error:', error);
    res.status(500).json({ success: false, message: '创建图表失败' });
  }
});

app.put('/api/charts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, settings, style, data_points, axis_settings } = req.body;

    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (settings !== undefined) { updates.push('settings = ?'); values.push(JSON.stringify(settings)); }
    if (style !== undefined) { updates.push('style = ?'); values.push(JSON.stringify(style)); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    if (updates.length > 1) {
      db.prepare(`UPDATE charts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    if (data_points && Array.isArray(data_points)) {
      const deleteStmt = db.prepare('DELETE FROM chart_data WHERE chart_id = ?');
      deleteStmt.run(id);
      
      const insertStmt = db.prepare('INSERT INTO chart_data (chart_id, label, value, color, sort_order) VALUES (?, ?, ?, ?, ?)');
      data_points.forEach((d, i) => insertStmt.run(id, d.label, d.value, d.color, i));
    }

    if (axis_settings) {
      const { x_title, y_title, y_min, y_max, y_interval, show_grid, show_align_line } = axis_settings;
      const existing = db.prepare('SELECT id FROM axis_settings WHERE chart_id = ?').get(id);
      
      if (existing) {
        db.prepare(`
          UPDATE axis_settings 
          SET x_title = ?, y_title = ?, y_min = ?, y_max = ?, y_interval = ?, show_grid = ?, show_align_line = ?
          WHERE chart_id = ?
        `).run(x_title, y_title, y_min, y_max, y_interval, show_grid, show_align_line, id);
      } else {
        db.prepare(`
          INSERT INTO axis_settings (chart_id, x_title, y_title, y_min, y_max, y_interval, show_grid, show_align_line)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, x_title, y_title, y_min, y_max, y_interval, show_grid, show_align_line);
      }
    }

    res.json({ success: true, message: '保存成功' });
  } catch (error) {
    console.error('Update chart error:', error);
    res.status(500).json({ success: false, message: '保存图表失败' });
  }
});

app.delete('/api/charts/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM charts WHERE id = ?').run(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete chart error:', error);
    res.status(500).json({ success: false, message: '删除图表失败' });
  }
});

app.post('/api/charts/:id/copy', (req, res) => {
  try {
    const { id } = req.params;
    const sourceChart = db.prepare('SELECT * FROM charts WHERE id = ?').get(id);
    
    if (!sourceChart) {
      return res.status(404).json({ success: false, message: '源图表不存在' });
    }

    const insertChart = db.prepare('INSERT INTO charts (title, type, settings, style) VALUES (?, ?, ?, ?)');
    const result = insertChart.run(
      sourceChart.title + ' (副本)',
      sourceChart.type,
      sourceChart.settings,
      sourceChart.style
    );
    const newChartId = result.lastInsertRowid;

    const sourceData = db.prepare('SELECT * FROM chart_data WHERE chart_id = ? ORDER BY sort_order').all(id);
    const insertData = db.prepare('INSERT INTO chart_data (chart_id, label, value, color, sort_order) VALUES (?, ?, ?, ?, ?)');
    sourceData.forEach(d => insertData.run(newChartId, d.label, d.value, d.color, d.sort_order));

    const sourceAxis = db.prepare('SELECT * FROM axis_settings WHERE chart_id = ?').get(id);
    if (sourceAxis) {
      db.prepare(`
        INSERT INTO axis_settings (chart_id, x_title, y_title, y_min, y_max, y_interval, show_grid, show_align_line)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newChartId, sourceAxis.x_title, sourceAxis.y_title, sourceAxis.y_min, sourceAxis.y_max, sourceAxis.y_interval, sourceAxis.show_grid, sourceAxis.show_align_line);
    }

    res.json({ success: true, data: { id: newChartId } });
  } catch (error) {
    console.error('Copy chart error:', error);
    res.status(500).json({ success: false, message: '复制图表失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Chartistic API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Chartistic Backend running on http://localhost:${PORT}`);
});
