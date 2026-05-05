const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const sectionController = {
  async getSectionList(req, res) {
    try {
      const { page = 1, page_size = 20, is_published } = req.query;

      let whereConditions = ['1=1'];
      let params = [];
      let paramIndex = 1;

      if (is_published !== undefined) {
        whereConditions.push(`is_published = $${paramIndex}`);
        params.push(is_published === 'true');
        paramIndex++;
      }

      const countQuery = `
        SELECT COUNT(*) as total FROM sections WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      const offset = (parseInt(page) - 1) * parseInt(page_size);
      const limit = parseInt(page_size);

      const listQuery = `
        SELECT s.*,
               (SELECT COUNT(*) FROM section_news WHERE section_id = s.id) as news_count
        FROM sections s
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY s.sort_order ASC, s.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const listParams = [...params, limit, offset];
      const listResult = await pool.query(listQuery, listParams);

      res.json({
        success: true,
        data: {
          list: listResult.rows,
          total,
          page: parseInt(page),
          page_size: parseInt(page_size),
          total_pages: Math.ceil(total / page_size)
        }
      });
    } catch (error) {
      console.error('Get section list error:', error);
      res.status(500).json({ success: false, message: '获取版块列表失败' });
    }
  },

  async getSectionById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT s.*,
               (SELECT json_agg(n ORDER BY sn.sort_order ASC)
                FROM news n
                JOIN section_news sn ON n.id = sn.news_id
                WHERE sn.section_id = s.id) as news_list
        FROM sections s
        WHERE s.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '版块不存在' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get section by id error:', error);
      res.status(500).json({ success: false, message: '获取版块详情失败' });
    }
  },

  async createSection(req, res) {
    try {
      const {
        name,
        description,
        call_type = 'category',
        call_config,
        refresh_interval = 300,
        item_count = 10,
        title_length = 30,
        html_output_path,
        sort_order = 0
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: '版块名称不能为空' });
      }

      const result = await pool.query(`
        INSERT INTO sections (
          name, description, call_type, call_config, refresh_interval,
          item_count, title_length, html_output_path, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        name.trim(),
        description,
        call_type,
        call_config || {},
        refresh_interval,
        item_count,
        title_length,
        html_output_path,
        sort_order
      ]);

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Create section error:', error);
      res.status(500).json({ success: false, message: '创建版块失败' });
    }
  },

  async updateSection(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        call_type,
        call_config,
        refresh_interval,
        item_count,
        title_length,
        html_output_path,
        sort_order,
        is_previewed,
        is_published
      } = req.body;

      if (name === '' || (name && !name.trim())) {
        return res.status(400).json({ success: false, message: '版块名称不能为空' });
      }

      const result = await pool.query(`
        UPDATE sections SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          call_type = COALESCE($3, call_type),
          call_config = COALESCE($4, call_config),
          refresh_interval = COALESCE($5, refresh_interval),
          item_count = COALESCE($6, item_count),
          title_length = COALESCE($7, title_length),
          html_output_path = COALESCE($8, html_output_path),
          sort_order = COALESCE($9, sort_order),
          is_previewed = COALESCE($10, is_previewed),
          is_published = COALESCE($11, is_published),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `, [
        name ? name.trim() : null,
        description,
        call_type,
        call_config,
        refresh_interval,
        item_count,
        title_length,
        html_output_path,
        sort_order,
        is_previewed,
        is_published,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '版块不存在' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Update section error:', error);
      res.status(500).json({ success: false, message: '更新版块失败' });
    }
  },

  async deleteSection(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        DELETE FROM sections WHERE id = $1 RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '版块不存在' });
      }

      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('Delete section error:', error);
      res.status(500).json({ success: false, message: '删除版块失败' });
    }
  },

  async previewSection(req, res) {
    try {
      const { id } = req.params;
      
      const sectionResult = await pool.query(`
        SELECT * FROM sections WHERE id = $1
      `, [id]);

      if (sectionResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: '版块不存在' });
      }

      const section = sectionResult.rows[0];
      let newsList = [];

      switch (section.call_type) {
        case 'category':
          if (section.call_config && section.call_config.category_ids) {
            const newsResult = await pool.query(`
              SELECT n.*, c.name as category_name
              FROM news n
              JOIN news_categories nc ON n.id = nc.news_id
              JOIN categories c ON nc.category_id = c.id
              WHERE nc.category_id = ANY($1::uuid[])
                AND n.status = 'published'
              ORDER BY n.sort_order ASC, n.publish_time DESC
              LIMIT $2
            `, [section.call_config.category_ids, section.item_count]);
            newsList = newsResult.rows;
          }
          break;
        case 'issue':
          if (section.call_config && section.call_config.issue) {
            const newsResult = await pool.query(`
              SELECT * FROM news 
              WHERE issue_number = $1 AND status = 'published'
              ORDER BY sort_order ASC, publish_time DESC
              LIMIT $2
            `, [section.call_config.issue, section.item_count]);
            newsList = newsResult.rows;
          }
          break;
        case 'keyword':
          if (section.call_config && section.call_config.keywords) {
            const conditions = section.call_config.keywords.map((_, i) => 
              `n.title ILIKE $${i + 2} OR n.summary ILIKE $${i + 2}`
            ).join(' OR ');
            const params = [section.item_count, ...section.call_config.keywords.map(k => `%${k}%`)];
            const newsResult = await pool.query(`
              SELECT * FROM news n
              WHERE status = 'published' AND (${conditions})
              ORDER BY sort_order ASC, publish_time DESC
              LIMIT $1
            `, params);
            newsList = newsResult.rows;
          }
          break;
      }

      const previewData = {
        section,
        newsList,
        previewHtml: generateSectionHtml(section, newsList)
      };

      await pool.query(`
        UPDATE sections SET is_previewed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [id]);

      res.json({ success: true, data: previewData });
    } catch (error) {
      console.error('Preview section error:', error);
      res.status(500).json({ success: false, message: '预览失败' });
    }
  },

  async publishSection(req, res) {
    try {
      const { id } = req.params;

      const sectionResult = await pool.query(`
        SELECT * FROM sections WHERE id = $1
      `, [id]);

      if (sectionResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: '版块不存在' });
      }

      const section = sectionResult.rows[0];

      if (!section.is_previewed) {
        return res.status(400).json({ 
          success: false, 
          message: '请先预览版块内容',
          need_preview: true
        });
      }

      if (section.html_output_path) {
        const previewResult = await sectionController.previewSection({ params: { id } }, {});
        if (previewResult.success && previewResult.data && previewResult.data.previewHtml) {
          await saveStaticHtml(section.html_output_path, previewResult.data.previewHtml);
        }
      }

      const result = await pool.query(`
        UPDATE sections 
        SET is_published = TRUE, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `, [id]);

      res.json({ success: true, data: result.rows[0], message: '发布成功' });
    } catch (error) {
      console.error('Publish section error:', error);
      res.status(500).json({ success: false, message: '发布失败' });
    }
  },

  async refreshSectionNews(req, res) {
    try {
      const { id } = req.params;

      const sectionResult = await pool.query(`
        SELECT * FROM sections WHERE id = $1
      `, [id]);

      if (sectionResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: '版块不存在' });
      }

      const section = sectionResult.rows[0];
      let newsIds = [];

      switch (section.call_type) {
        case 'category':
          if (section.call_config && section.call_config.category_ids) {
            const newsResult = await pool.query(`
              SELECT n.id FROM news n
              JOIN news_categories nc ON n.id = nc.news_id
              WHERE nc.category_id = ANY($1::uuid[])
                AND n.status = 'published'
              ORDER BY n.sort_order ASC, n.publish_time DESC
              LIMIT $2
            `, [section.call_config.category_ids, section.item_count]);
            newsIds = newsResult.rows.map(r => r.id);
          }
          break;
        case 'issue':
          if (section.call_config && section.call_config.issue) {
            const newsResult = await pool.query(`
              SELECT id FROM news 
              WHERE issue_number = $1 AND status = 'published'
              ORDER BY sort_order ASC, publish_time DESC
              LIMIT $2
            `, [section.call_config.issue, section.item_count]);
            newsIds = newsResult.rows.map(r => r.id);
          }
          break;
        case 'keyword':
          if (section.call_config && section.call_config.keywords) {
            const conditions = section.call_config.keywords.map((_, i) => 
              `title ILIKE $${i + 2} OR summary ILIKE $${i + 2}`
            ).join(' OR ');
            const params = [section.item_count, ...section.call_config.keywords.map(k => `%${k}%`)];
            const newsResult = await pool.query(`
              SELECT id FROM news
              WHERE status = 'published' AND (${conditions})
              ORDER BY sort_order ASC, publish_time DESC
              LIMIT $1
            `, params);
            newsIds = newsResult.rows.map(r => r.id);
          }
          break;
      }

      await pool.query('DELETE FROM section_news WHERE section_id = $1', [id]);

      for (let i = 0; i < newsIds.length; i++) {
        await pool.query(`
          INSERT INTO section_news (section_id, news_id, sort_order)
          VALUES ($1, $2, $3)
        `, [id, newsIds[i], i]);
      }

      res.json({ success: true, message: '刷新成功', news_count: newsIds.length });
    } catch (error) {
      console.error('Refresh section news error:', error);
      res.status(500).json({ success: false, message: '刷新失败' });
    }
  }
};

function generateSectionHtml(section, newsList) {
  const truncateTitle = (title, length) => {
    if (!title) return '';
    if (title.length <= length) return title;
    return title.substring(0, length) + '...';
  };

  let newsHtml = '';
  newsList.forEach((news, index) => {
    const displayTitle = truncateTitle(news.title, section.title_length || 30);
    const dateStr = news.publish_time ? new Date(news.publish_time).toLocaleDateString() : '';
    newsHtml += `<li class="news-item">
      <span class="index">${index + 1}</span>
      <a href="/news/${news.id}" class="title">${displayTitle}</a>
      <span class="date">${dateStr}</span>
    </li>`;
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${section.name}</title>
  <style>
    .section-container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .section-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
    .news-list { list-style: none; padding: 0; margin: 0; }
    .news-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
    .news-item .index { width: 30px; height: 30px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px; color: #666; }
    .news-item .title { flex: 1; color: #333; text-decoration: none; font-size: 16px; }
    .news-item .title:hover { color: #1890ff; }
    .news-item .date { color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <div class="section-container">
    <h2 class="section-title">${section.name}</h2>
    <ul class="news-list">
      ${newsHtml}
    </ul>
  </div>
</body>
</html>`;
}

async function saveStaticHtml(outputPath, htmlContent) {
  try {
    const fullPath = path.join(process.cwd(), outputPath);
    const dirPath = path.dirname(fullPath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, htmlContent, 'utf-8');
    console.log(`Static HTML saved to: ${fullPath}`);
  } catch (error) {
    console.error('Save static HTML error:', error);
    throw error;
  }
}

module.exports = sectionController;
