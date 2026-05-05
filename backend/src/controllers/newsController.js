const pool = require('../config/database');
const redis = require('../config/redis');
const dayjs = require('dayjs');

const newsController = {
  async getNewsList(req, res) {
    try {
      const { 
        category_id, 
        keyword, 
        author, 
        lottery_type,
        status,
        page = 1, 
        page_size = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      let whereConditions = ['1=1'];
      let params = [];
      let paramIndex = 1;

      if (category_id) {
        whereConditions.push(`n.id IN (SELECT news_id FROM news_categories WHERE category_id = $${paramIndex})`);
        params.push(category_id);
        paramIndex++;
      }

      if (keyword) {
        whereConditions.push(`(n.title ILIKE $${paramIndex} OR n.summary ILIKE $${paramIndex} OR n.content ILIKE $${paramIndex})`);
        params.push(`%${keyword}%`);
        paramIndex++;
      }

      if (author) {
        whereConditions.push(`n.author ILIKE $${paramIndex}`);
        params.push(`%${author}%`);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`n.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (lottery_type) {
        whereConditions.push(`n.issue_number ILIKE $${paramIndex}`);
        params.push(`%${lottery_type}%`);
        paramIndex++;
      }

      const validSortFields = ['created_at', 'updated_at', 'publish_time', 'sort_order', 'title'];
      const validSortOrders = ['asc', 'desc'];
      const actualSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const actualSortOrder = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order : 'desc';

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM news n 
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      const offset = (parseInt(page) - 1) * parseInt(page_size);
      const limit = parseInt(page_size);

      const listQuery = `
        SELECT n.*, 
               (SELECT array_agg(c.name) 
                FROM categories c 
                JOIN news_categories nc ON c.id = nc.category_id 
                WHERE nc.news_id = n.id) as category_names
        FROM news n 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY n.${actualSortBy} ${actualSortOrder}
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
      console.error('Get news list error:', error);
      res.status(500).json({ success: false, message: '获取新闻列表失败' });
    }
  },

  async getNewsById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT n.*,
               (SELECT json_agg(c) 
                FROM categories c 
                JOIN news_categories nc ON c.id = nc.category_id 
                WHERE nc.news_id = n.id) as categories,
               (SELECT json_agg(s) 
                FROM sections s 
                JOIN section_news sn ON s.id = sn.section_id 
                WHERE sn.news_id = n.id) as sections
        FROM news n 
        WHERE n.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '新闻不存在' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get news by id error:', error);
      res.status(500).json({ success: false, message: '获取新闻详情失败' });
    }
  },

  async createNews(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        title,
        issue_number,
        summary,
        content,
        author,
        source,
        keywords,
        bottom_template_id,
        related_news,
        lottery_info,
        category_ids,
        section_ids,
        status = 'draft',
        publish_immediately
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: '新闻标题不能为空' });
      }

      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const publishTime = publish_immediately ? now : null;
      const finalStatus = publish_immediately ? 'published' : status;

      const newsResult = await client.query(`
        INSERT INTO news (
          title, issue_number, summary, content, author, source, keywords,
          bottom_template_id, related_news, lottery_info, status, publish_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        title.trim(),
        issue_number,
        summary,
        content,
        author,
        source,
        keywords || [],
        bottom_template_id || null,
        related_news || [],
        lottery_info || null,
        finalStatus,
        publishTime
      ]);

      const newsId = newsResult.rows[0].id;

      if (category_ids && category_ids.length > 0) {
        for (const catId of category_ids) {
          await client.query(`
            INSERT INTO news_categories (news_id, category_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [newsId, catId]);
        }
      }

      if (section_ids && section_ids.length > 0) {
        for (const secId of section_ids) {
          await client.query(`
            INSERT INTO section_news (section_id, news_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [secId, newsId]);
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: newsResult.rows[0],
        message: publish_immediately ? '新闻发布成功' : '新闻创建成功'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create news error:', error);
      res.status(500).json({ success: false, message: '创建新闻失败' });
    } finally {
      client.release();
    }
  },

  async updateNews(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const {
        title,
        issue_number,
        summary,
        content,
        author,
        source,
        keywords,
        bottom_template_id,
        related_news,
        lottery_info,
        category_ids,
        section_ids,
        status
      } = req.body;

      const newsCheck = await client.query('SELECT * FROM news WHERE id = $1', [id]);
      if (newsCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: '新闻不存在' });
      }

      const updateResult = await client.query(`
        UPDATE news SET
          title = COALESCE($1, title),
          issue_number = COALESCE($2, issue_number),
          summary = COALESCE($3, summary),
          content = COALESCE($4, content),
          author = COALESCE($5, author),
          source = COALESCE($6, source),
          keywords = COALESCE($7, keywords),
          bottom_template_id = COALESCE($8, bottom_template_id),
          related_news = COALESCE($9, related_news),
          lottery_info = COALESCE($10, lottery_info),
          status = COALESCE($11, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `, [
        title ? title.trim() : null,
        issue_number,
        summary,
        content,
        author,
        source,
        keywords,
        bottom_template_id,
        related_news,
        lottery_info,
        status,
        id
      ]);

      if (category_ids !== undefined) {
        await client.query('DELETE FROM news_categories WHERE news_id = $1', [id]);
        if (category_ids.length > 0) {
          for (const catId of category_ids) {
            await client.query(`
              INSERT INTO news_categories (news_id, category_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [id, catId]);
          }
        }
      }

      if (section_ids !== undefined) {
        await client.query('DELETE FROM section_news WHERE news_id = $1', [id]);
        if (section_ids.length > 0) {
          for (const secId of section_ids) {
            await client.query(`
              INSERT INTO section_news (section_id, news_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [secId, id]);
          }
        }
      }

      await client.query('COMMIT');

      res.json({ success: true, data: updateResult.rows[0], message: '更新成功' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update news error:', error);
      res.status(500).json({ success: false, message: '更新新闻失败' });
    } finally {
      client.release();
    }
  },

  async publishNews(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        UPDATE news 
        SET status = 'published', 
            publish_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status != 'published'
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(400).json({ success: false, message: '新闻不存在或已发布' });
      }

      res.json({ success: true, data: result.rows[0], message: '发布成功' });
    } catch (error) {
      console.error('Publish news error:', error);
      res.status(500).json({ success: false, message: '发布失败' });
    }
  },

  async deleteNews(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        DELETE FROM news WHERE id = $1 RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '新闻不存在' });
      }

      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('Delete news error:', error);
      res.status(500).json({ success: false, message: '删除失败' });
    }
  },

  async addToSections(req, res) {
    try {
      const { id } = req.params;
      const { section_ids } = req.body;

      if (!section_ids || section_ids.length === 0) {
        return res.status(400).json({ success: false, message: '请选择版块' });
      }

      const newsCheck = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
      if (newsCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: '新闻不存在' });
      }

      for (const secId of section_ids) {
        await pool.query(`
          INSERT INTO section_news (section_id, news_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [secId, id]);
      }

      res.json({ success: true, message: '添加成功' });
    } catch (error) {
      console.error('Add to sections error:', error);
      res.status(500).json({ success: false, message: '添加失败' });
    }
  },

  async updateSortOrder(req, res) {
    try {
      const { id } = req.params;
      const { sort_order } = req.body;

      const result = await pool.query(`
        UPDATE news SET sort_order = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [sort_order, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '新闻不存在' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Update sort order error:', error);
      res.status(500).json({ success: false, message: '更新排序失败' });
    }
  }
};

module.exports = newsController;
