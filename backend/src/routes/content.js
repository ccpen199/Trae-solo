const express = require('express');
const { allAsync, getAsync } = require('../utils/db');
const { success, error, pagination } = require('../utils/response');

const router = express.Router();

router.get('/ads', async (req, res) => {
  try {
    const ads = await allAsync(`
      SELECT * FROM ads
      WHERE is_active = 1
      ORDER BY sort_order ASC, created_at DESC
      LIMIT 10
    `);
    res.json(success(ads));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取广告失败'));
  }
});

router.get('/radios', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const radios = await allAsync(`
      SELECT * FROM radios
      WHERE is_active = 1
      ORDER BY listener_count DESC
      LIMIT ? OFFSET ?
    `, [parseInt(pageSize), offset]);

    const totalResult = await getAsync('SELECT COUNT(*) as count FROM radios WHERE is_active = 1');

    res.json(success(pagination(radios, totalResult.count, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取电台失败'));
  }
});

router.get('/articles', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const articles = await allAsync(`
      SELECT * FROM articles
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(pageSize), offset]);

    const totalResult = await getAsync('SELECT COUNT(*) as count FROM articles');

    res.json(success(pagination(articles, totalResult.count, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取专栏失败'));
  }
});

router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await getAsync('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json(error('文章不存在'));
    }

    res.json(success(article));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取文章失败'));
  }
});

router.get('/videos', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const videos = await allAsync(`
      SELECT * FROM videos
      ORDER BY view_count DESC, created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(pageSize), offset]);

    const totalResult = await getAsync('SELECT COUNT(*) as count FROM videos');

    res.json(success(pagination(videos, totalResult.count, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取视频失败'));
  }
});

module.exports = router;