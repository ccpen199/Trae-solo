const express = require('express');
const { runAsync, getAsync, allAsync } = require('../utils/db');
const { successResponse, errorResponse, handleError } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const initPosts = async () => {
  const count = await getAsync('SELECT COUNT(*) as count FROM world_posts');
  if (count.count === 0) {
    const samplePosts = [
      { title: '日常英语表达', content: '学习日常交流中常用的英语表达方式，让你的口语更加地道自然。', language: 'en', likes_count: 128 },
      { title: '旅游英语必备', content: '出国旅游必备的英语句子，包括机场、酒店、餐厅等场景。', language: 'en', likes_count: 89 },
      { title: '商务邮件写作', content: '商务邮件的写作技巧，常用句型和格式规范。', language: 'en', likes_count: 256 },
      { title: '日语入门词汇', content: '学习日语最基础的词汇，为日语学习打下坚实基础。', language: 'ja', likes_count: 67 },
      { title: '韩语日常对话', content: '韩语日常对话常用表达，轻松应对韩国旅行。', language: 'ko', likes_count: 145 }
    ];

    for (const post of samplePosts) {
      await runAsync(
        'INSERT INTO world_posts (title, content, language, likes_count) VALUES (?, ?, ?, ?)',
        [post.title, post.content, post.language, post.likes_count]
      );
    }
  }
};

initPosts().catch(console.error);

router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, language } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT wp.*, u.nickname, u.avatar FROM world_posts wp LEFT JOIN users u ON wp.user_id = u.id';
    let params = [];

    if (language) {
      sql += ' WHERE wp.language = ?';
      params.push(language);
    }

    sql += ' ORDER BY wp.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const posts = await allAsync(sql, params);

    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      if (req.user) {
        const like = await getAsync(
          'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
          [req.user.id, post.id]
        );
        return { ...post, is_liked: !!like };
      }
      return { ...post, is_liked: false };
    }));

    res.json(successResponse({ posts: postsWithLikeStatus, total: postsWithLikeStatus.length }));
  } catch (error) {
    handleError(res, error, '获取帖子失败');
  }
});

router.post('/posts/:postId/like', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const existingLike = await getAsync(
      'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existingLike) {
      await runAsync('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      await runAsync('UPDATE world_posts SET likes_count = likes_count - 1 WHERE id = ?', [postId]);
      return res.json(successResponse({ liked: false }, '取消点赞成功'));
    }

    await runAsync('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
    await runAsync('UPDATE world_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);

    res.json(successResponse({ liked: true }, '点赞成功'));
  } catch (error) {
    handleError(res, error, '操作失败');
  }
});

router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await getAsync(
      'SELECT wp.*, u.nickname, u.avatar FROM world_posts wp LEFT JOIN users u ON wp.user_id = u.id WHERE wp.id = ?',
      [postId]
    );

    if (!post) {
      return res.status(404).json(errorResponse('帖子不存在'));
    }

    let isLiked = false;
    if (req.user) {
      const like = await getAsync(
        'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
        [req.user.id, postId]
      );
      isLiked = !!like;
    }

    res.json(successResponse({ post: { ...post, is_liked: isLiked } }));
  } catch (error) {
    handleError(res, error, '获取帖子详情失败');
  }
});

module.exports = router;
