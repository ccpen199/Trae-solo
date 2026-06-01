-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  is_vip INTEGER DEFAULT 0,
  vip_level INTEGER DEFAULT 0,
  view_history_vector TEXT,
  content_quality_score REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 影片表
CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  poster TEXT,
  description TEXT,
  duration INTEGER,
  release_date DATE,
  genre TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 演出表
CREATE TABLE IF NOT EXISTS performances (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  poster TEXT,
  description TEXT,
  duration INTEGER,
  performance_date DATE,
  venue TEXT,
  type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 多源评分表
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL,
  source TEXT NOT NULL,
  score REAL NOT NULL,
  vote_count INTEGER NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 主创表
CREATE TABLE IF NOT EXISTS cast_members (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  influence_weight REAL DEFAULT 0,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 热度趋势表
CREATE TABLE IF NOT EXISTS heat_trends (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL,
  trend_date DATE NOT NULL,
  value REAL NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 场次表
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  movie_id TEXT,
  performance_id TEXT,
  cinema_name TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  hall_type TEXT NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (performance_id) REFERENCES performances(id)
);

-- 座位表
CREATE TABLE IF NOT EXISTS seats (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  row_num INTEGER NOT NULL,
  col_num INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  seat_type TEXT NOT NULL DEFAULT 'normal',
  view_angle REAL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  coupon_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 票务合约表
CREATE TABLE IF NOT EXISTS ticket_contracts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  blockchain_hash TEXT,
  transfer_restricted INTEGER DEFAULT 1,
  refund_policy TEXT,
  watermark_seed TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- 积分表
CREATE TABLE IF NOT EXISTS vip_points (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  source TEXT NOT NULL,
  expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  is_used INTEGER DEFAULT 0,
  expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS ugc_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  movie_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  quality_score REAL DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 短视频表
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  movie_id TEXT,
  tags TEXT,
  completion_rate REAL DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  publish_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 电影节表
CREATE TABLE IF NOT EXISTS film_festivals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 电影节排片表
CREATE TABLE IF NOT EXISTS festival_schedules (
  id TEXT PRIMARY KEY,
  festival_id TEXT NOT NULL,
  movie_id TEXT NOT NULL,
  screening_time DATETIME NOT NULL,
  venue TEXT NOT NULL,
  FOREIGN KEY (festival_id) REFERENCES film_festivals(id),
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 导演访谈表
CREATE TABLE IF NOT EXISTS director_interviews (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  director_name TEXT NOT NULL,
  movie_id TEXT,
  video_url TEXT,
  publish_date DATE,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- 关注关系表
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id),
  UNIQUE(follower_id, following_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_scores_movie_source ON scores(movie_id, source);
CREATE INDEX IF NOT EXISTS idx_sessions_movie ON sessions(movie_id);
CREATE INDEX IF NOT EXISTS idx_seats_session ON seats(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON ugc_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON ticket_contracts(order_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON vip_points(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);
