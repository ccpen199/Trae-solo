import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  initDB,
  getUserByUsername,
  createUser,
  getUserById,
  getBooks,
  getBookById,
  borrowBook,
  returnBook,
  getBorrowRecords,
  getCategories,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  addNote,
  getNotes,
  getUserStats,
  getVipPlans,
  subscribeVip,
  getPosts,
  getPostById,
  createPost,
  likePost,
  getComments,
  addComment
} from './db.js';
import { generateToken, verifyToken, hashPassword, comparePassword } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 48180;

app.use(cors({
  origin: 'http://localhost:48181',
  credentials: true
}));
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ success: false, message: '登录已过期，请重新登录' });
  }

  req.user = user;
  next();
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请填写用户名和密码' });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = await createUser(username, hashedPassword, email);
    const token = generateToken({ id: userId, username });
    const user = await getUserById(userId);

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          nickname: user.nickname,
          is_vip: user.is_vip
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请填写用户名和密码' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const token = generateToken({ id: user.id, username: user.username });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          nickname: user.nickname,
          is_vip: user.is_vip
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        nickname: user.nickname,
        is_vip: user.is_vip,
        vip_expire_at: user.vip_expire_at,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/books', async (req, res) => {
  try {
    const { category_id, search, page = 1, limit = 20 } = req.query;
    const books = await getBooks({
      category_id: category_id ? parseInt(category_id) : null,
      search: search || null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取书籍列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/books/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/books/featured', async (req, res) => {
  try {
    const books = await getBooks({ is_featured: true, limit: 20 });
    res.json({ success: true, data: books });
  } catch (error) {
    console.error('获取精选书籍错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/books/borrowed/my', authenticateToken, async (req, res) => {
  try {
    const records = await getBorrowRecords(req.user.id);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('获取借阅记录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: '书籍不存在' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    console.error('获取书籍详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/books/:id/borrow', authenticateToken, async (req, res) => {
  try {
    const result = await borrowBook(req.user.id, req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: '借阅成功' });
  } catch (error) {
    console.error('借阅错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/books/:id/return', authenticateToken, async (req, res) => {
  try {
    const result = await returnBook(req.user.id, req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: '归还成功' });
  } catch (error) {
    console.error('归还错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const { book_id } = req.body;
    const result = await addToWishlist(req.user.id, book_id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: '添加成功', data: { id: result.id } });
  } catch (error) {
    console.error('添加心愿单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await getWishlist(req.user.id);
    res.json({ success: true, data: wishlist });
  } catch (error) {
    console.error('获取心愿单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/user/wishlist/:id', authenticateToken, async (req, res) => {
  try {
    const result = await removeFromWishlist(req.user.id, req.params.id);
    if (!result.success) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除心愿单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/user/notes', authenticateToken, async (req, res) => {
  try {
    const { book_id, content, page } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '请输入笔记内容' });
    }

    const noteId = await addNote(req.user.id, book_id, content, page);
    res.json({ success: true, message: '添加成功', data: { id: noteId } });
  } catch (error) {
    console.error('添加笔记错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/user/notes', authenticateToken, async (req, res) => {
  try {
    const notes = await getNotes(req.user.id);
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('获取笔记错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getUserStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/vip/plans', async (req, res) => {
  try {
    const plans = await getVipPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('获取VIP套餐错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/vip/subscribe', authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.body;
    const result = await subscribeVip(req.user.id, plan_id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: '开通VIP成功', data: { vip_expire_at: result.vip_expire_at } });
  } catch (error) {
    console.error('开通VIP错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/square/posts', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const posts = await getPosts(parseInt(limit));
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('获取动态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/square/posts', authenticateToken, async (req, res) => {
  try {
    const { book_id, content, share_reason } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '请输入分享内容' });
    }

    const postId = await createPost(req.user.id, book_id, content, share_reason);
    res.json({ success: true, message: '分享成功', data: { id: postId } });
  } catch (error) {
    console.error('创建动态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/square/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const result = await likePost(req.user.id, req.params.id);
    res.json({ success: true, data: { liked: result.liked } });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/square/posts/:id/comments', async (req, res) => {
  try {
    const comments = await getComments(req.params.id);
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/square/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '请输入评论内容' });
    }

    const commentId = await addComment(req.params.id, req.user.id, content);
    res.json({ success: true, message: '评论成功', data: { id: commentId } });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '藏书馆API运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

initDB();

app.listen(PORT, () => {
  console.log(`
  ========================================
  📚 藏书馆后端服务已启动
  🌐 服务器地址: http://localhost:${PORT}
  📡 API健康检查: http://localhost:${PORT}/api/health
  ========================================
  `);
});
