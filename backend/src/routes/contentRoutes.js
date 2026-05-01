const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const contentService = require('../services/contentService');
const { Content, Category, WeightTag } = require('../models');

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/weight-tags', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const tags = await WeightTag.findAll({
      where: { status: 'active' },
      order: [['category', 'ASC'], ['weightValue', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        tags
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/weight-tags', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { name, code, weightValue, category, description } = req.body;
    
    if (!name || !code) {
      throw new AppError('标签名称和编码不能为空', 400);
    }
    
    const tag = await WeightTag.create({
      name,
      code,
      weightValue: weightValue || 1.0,
      category: category || 'custom',
      description,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      message: '权重标签创建成功',
      data: {
        tag
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/import', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { title, content, source, sourceUrl, coverImage, author } = req.body;
    
    if (!title || !content) {
      throw new AppError('标题和内容不能为空', 400);
    }
    
    const result = await contentService.importContent({
      title,
      content,
      source,
      sourceUrl,
      coverImage,
      author
    }, req.user.id);
    
    res.status(201).json({
      success: true,
      message: '内容入库成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch-import', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { contents } = req.body;
    
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      throw new AppError('内容列表不能为空', 400);
    }
    
    const results = [];
    
    for (const contentData of contents) {
      try {
        const result = await contentService.importContent(contentData, req.user.id);
        results.push({
          success: true,
          data: result
        });
      } catch (err) {
        results.push({
          success: false,
          error: err.message,
          data: contentData
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.json({
      success: true,
      message: `批量导入完成：成功 ${successCount} 条，失败 ${failCount} 条`,
      data: {
        total: results.length,
        success: successCount,
        fail: failCount,
        results
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/analyze', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await contentService.analyzeContent(id);
    
    res.json({
      success: true,
      message: '内容分析完成',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/weight-tags', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weightTagIds } = req.body;
    
    if (!weightTagIds || !Array.isArray(weightTagIds)) {
      throw new AppError('权重标签ID列表不能为空', 400);
    }
    
    const content = await contentService.setWeightTags(id, weightTagIds, req.user.id);
    
    res.json({
      success: true,
      message: '权重标签设置成功',
      data: {
        content
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/publish', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await contentService.publishContent(id, req.user.id);
    
    res.json({
      success: true,
      message: '内容发布成功',
      data: {
        content
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      status,
      categoryId,
      keyword,
      page = 1,
      pageSize = 20,
      orderBy = 'createdAt',
      orderDirection = 'DESC'
    } = req.query;
    
    const result = await contentService.listContents({
      status,
      categoryId,
      keyword,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      orderBy,
      orderDirection
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findByPk(id, {
      include: [
        { association: 'category', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['id', 'username', 'nickname'] }
      ]
    });
    
    if (!content) {
      throw new AppError('内容不存在', 404);
    }
    
    if (req.user && req.user.role === 'reader') {
      await content.increment('viewCount');
    }
    
    res.json({
      success: true,
      data: {
        content
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, source, sourceUrl, coverImage, author, summary } = req.body;
    
    const existingContent = await Content.findByPk(id);
    
    if (!existingContent) {
      throw new AppError('内容不存在', 404);
    }
    
    const beforeData = existingContent.toJSON();
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) {
      updateData.content = content;
      updateData.summary = summary || content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }
    if (source !== undefined) updateData.source = source;
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (author !== undefined) updateData.author = author;
    
    await existingContent.update(updateData);
    
    res.json({
      success: true,
      message: '内容更新成功',
      data: {
        content: existingContent
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('operator', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findByPk(id);
    
    if (!content) {
      throw new AppError('内容不存在', 404);
    }
    
    await content.update({ status: 'archived' });
    
    res.json({
      success: true,
      message: '内容已归档'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
