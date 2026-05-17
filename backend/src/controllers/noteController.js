const { run, get, all } = require('../models/database');

async function createNote(req, res) {
  try {
    const { title, content, images, video, location, topics } = req.body;

    if (!content && !images && !video) {
      return res.status(400).json({ success: false, message: '内容不能为空' });
    }

    const imageStr = images ? JSON.stringify(images) : null;
    const topicIds = topics ? JSON.stringify(topics) : null;

    const result = await run(
      'INSERT INTO notes (user_id, title, content, images, video, location, topic_ids) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, content, imageStr, video, location, topicIds]
    );

    if (topics && topics.length > 0) {
      for (const topicName of topics) {
        try {
          await run('INSERT INTO topics (name) VALUES (?)', [topicName]);
        } catch (e) {}
        await run('UPDATE topics SET notes_count = notes_count + 1 WHERE name = ?', [topicName]);
      }
    }

    const note = await get('SELECT * FROM notes WHERE id = ?', [result.id]);

    res.json({ success: true, message: '发布成功', data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getNoteList(req, res) {
  try {
    const { page = 1, pageSize = 20, type = 'discover', userId } = req.query;
    const offset = (page - 1) * pageSize;

    let notes = [];
    let total = 0;

    if (type === 'following' && req.user) {
      notes = await all(
        `SELECT n.*, u.nickname, u.avatar 
         FROM notes n 
         JOIN users u ON n.user_id = u.id 
         JOIN follows f ON f.following_id = n.user_id 
         WHERE f.follower_id = ? AND n.status = 1 
         ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
        [req.user.id, parseInt(pageSize), offset]
      );

      const totalResult = await get(
        `SELECT COUNT(*) as count FROM notes n 
         JOIN follows f ON f.following_id = n.user_id 
         WHERE f.follower_id = ? AND n.status = 1`,
        [req.user.id]
      );
      total = totalResult.count;
    } else if (userId) {
      notes = await all(
        `SELECT n.*, u.nickname, u.avatar 
         FROM notes n 
         JOIN users u ON n.user_id = u.id 
         WHERE n.user_id = ? AND n.status = 1 
         ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
        [userId, parseInt(pageSize), offset]
      );

      const totalResult = await get(
        'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND status = 1',
        [userId]
      );
      total = totalResult.count;
    } else {
      notes = await all(
        `SELECT n.*, u.nickname, u.avatar 
         FROM notes n 
         JOIN users u ON n.user_id = u.id 
         WHERE n.status = 1 
         ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
        [parseInt(pageSize), offset]
      );

      const totalResult = await get('SELECT COUNT(*) as count FROM notes WHERE status = 1');
      total = totalResult.count;
    }

    notes = notes.map(note => ({
      ...note,
      images: note.images ? JSON.parse(note.images) : [],
      topic_ids: note.topic_ids ? JSON.parse(note.topic_ids) : []
    }));

    if (req.user) {
      for (const note of notes) {
        const like = await get(
          'SELECT * FROM note_likes WHERE user_id = ? AND note_id = ?',
          [req.user.id, note.id]
        );
        note.isLiked = !!like;

        const collect = await get(
          'SELECT * FROM note_collects WHERE user_id = ? AND note_id = ?',
          [req.user.id, note.id]
        );
        note.isCollected = !!collect;
      }
    }

    res.json({
      success: true,
      data: {
        list: notes,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getNoteDetail(req, res) {
  try {
    const { noteId } = req.params;

    const note = await get(
      `SELECT n.*, u.nickname, u.avatar 
       FROM notes n 
       JOIN users u ON n.user_id = u.id 
       WHERE n.id = ? AND n.status = 1`,
      [noteId]
    );

    if (!note) {
      return res.status(404).json({ success: false, message: '笔记不存在' });
    }

    note.images = note.images ? JSON.parse(note.images) : [];
    note.topic_ids = note.topic_ids ? JSON.parse(note.topic_ids) : [];

    if (req.user) {
      const like = await get(
        'SELECT * FROM note_likes WHERE user_id = ? AND note_id = ?',
        [req.user.id, note.id]
      );
      note.isLiked = !!like;

      const collect = await get(
        'SELECT * FROM note_collects WHERE user_id = ? AND note_id = ?',
        [req.user.id, note.id]
      );
      note.isCollected = !!collect;
    }

    await run('UPDATE notes SET views_count = views_count + 1 WHERE id = ?', [noteId]);

    const relatedNotes = await all(
      `SELECT n.*, u.nickname, u.avatar 
       FROM notes n 
       JOIN users u ON n.user_id = u.id 
       WHERE n.status = 1 AND n.id != ? 
       ORDER BY RANDOM() LIMIT 6`,
      [noteId]
    );

    res.json({
      success: true,
      data: {
        note,
        relatedNotes: relatedNotes.map(n => ({
          ...n,
          images: n.images ? JSON.parse(n.images) : []
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function likeNote(req, res) {
  try {
    const { noteId } = req.params;

    const note = await get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) {
      return res.status(404).json({ success: false, message: '笔记不存在' });
    }

    try {
      await run(
        'INSERT INTO note_likes (user_id, note_id) VALUES (?, ?)',
        [req.user.id, noteId]
      );
      await run('UPDATE notes SET likes_count = likes_count + 1 WHERE id = ?', [noteId]);
      res.json({ success: true, message: '点赞成功', data: { isLiked: true } });
    } catch (e) {
      await run(
        'DELETE FROM note_likes WHERE user_id = ? AND note_id = ?',
        [req.user.id, noteId]
      );
      await run('UPDATE notes SET likes_count = likes_count - 1 WHERE id = ?', [noteId]);
      res.json({ success: true, message: '取消点赞成功', data: { isLiked: false } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function collectNote(req, res) {
  try {
    const { noteId } = req.params;
    const { albumId } = req.body;

    const note = await get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) {
      return res.status(404).json({ success: false, message: '笔记不存在' });
    }

    const existing = await get(
      'SELECT * FROM note_collects WHERE user_id = ? AND note_id = ?',
      [req.user.id, noteId]
    );

    if (existing) {
      await run(
        'DELETE FROM note_collects WHERE user_id = ? AND note_id = ?',
        [req.user.id, noteId]
      );
      await run('UPDATE notes SET collects_count = collects_count - 1 WHERE id = ?', [noteId]);
      res.json({ success: true, message: '取消收藏成功', data: { isCollected: false } });
    } else {
      await run(
        'INSERT INTO note_collects (user_id, note_id, album_id) VALUES (?, ?, ?)',
        [req.user.id, noteId, albumId || null]
      );
      await run('UPDATE notes SET collects_count = collects_count + 1 WHERE id = ?', [noteId]);
      res.json({ success: true, message: '收藏成功', data: { isCollected: true } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getComments(req, res) {
  try {
    const { noteId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const comments = await all(
      `SELECT c.*, u.nickname, u.avatar 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.note_id = ? AND c.status = 1 AND c.parent_id IS NULL 
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [noteId, parseInt(pageSize), offset]
    );

    const totalResult = await get(
      'SELECT COUNT(*) as count FROM comments WHERE note_id = ? AND status = 1 AND parent_id IS NULL',
      [noteId]
    );

    for (const comment of comments) {
      const replies = await all(
        `SELECT c.*, u.nickname, u.avatar 
         FROM comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.parent_id = ? AND c.status = 1 
         ORDER BY c.created_at ASC LIMIT 5`,
        [comment.id]
      );
      comment.replies = replies;
    }

    res.json({
      success: true,
      data: {
        list: comments,
        total: totalResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function addComment(req, res) {
  try {
    const { noteId } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const note = await get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) {
      return res.status(404).json({ success: false, message: '笔记不存在' });
    }

    const result = await run(
      'INSERT INTO comments (user_id, note_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [req.user.id, noteId, parentId || null, content]
    );

    await run('UPDATE notes SET comments_count = comments_count + 1 WHERE id = ?', [noteId]);

    const comment = await get(
      `SELECT c.*, u.nickname, u.avatar 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.id]
    );

    res.json({ success: true, message: '评论成功', data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getTopics(req, res) {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let topics = [];
    let total = 0;

    if (keyword) {
      topics = await all(
        'SELECT * FROM topics WHERE name LIKE ? ORDER BY notes_count DESC LIMIT ? OFFSET ?',
        [`%${keyword}%`, parseInt(pageSize), offset]
      );

      const totalResult = await get(
        'SELECT COUNT(*) as count FROM topics WHERE name LIKE ?',
        [`%${keyword}%`]
      );
      total = totalResult.count;
    } else {
      topics = await all(
        'SELECT * FROM topics ORDER BY notes_count DESC LIMIT ? OFFSET ?',
        [parseInt(pageSize), offset]
      );

      const totalResult = await get('SELECT COUNT(*) as count FROM topics');
      total = totalResult.count;
    }

    res.json({
      success: true,
      data: {
        list: topics,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  createNote,
  getNoteList,
  getNoteDetail,
  likeNote,
  collectNote,
  getComments,
  addComment,
  getTopics
};
