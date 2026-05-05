-- 资讯CMS系统数据库初始化脚本
-- PostgreSQL

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 类别表（导航树结构）
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'category', -- root, lottery, topic
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  issue_number VARCHAR(50),
  summary TEXT,
  content TEXT,
  author VARCHAR(100),
  source VARCHAR(100),
  keywords TEXT[],
  bottom_template_id UUID,
  related_news UUID[],
  lottery_info JSONB,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  sort_order INTEGER DEFAULT 0,
  publish_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻-类别关联表（多对多）
CREATE TABLE IF NOT EXISTS news_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(news_id, category_id)
);

-- 版块表
CREATE TABLE IF NOT EXISTS sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  call_type VARCHAR(20) DEFAULT 'category', -- category, issue, keyword
  call_config JSONB, -- { category_ids: [], issue: '', keywords: [] }
  refresh_interval INTEGER DEFAULT 300, -- 秒
  item_count INTEGER DEFAULT 10,
  title_length INTEGER DEFAULT 30,
  html_output_path VARCHAR(500),
  is_previewed BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 版块-新闻关联表（调用关系）
CREATE TABLE IF NOT EXISTS section_news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section_id, news_id)
);

-- 关键字表
CREATE TABLE IF NOT EXISTS keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  link_url VARCHAR(500),
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模板表
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- bottom, list, detail
  content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 静态生成规则表
CREATE TABLE IF NOT EXISTS static_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(20) NOT NULL, -- category, section, news
  target_id UUID,
  output_path VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 开奖信息表
CREATE TABLE IF NOT EXISTS lottery_draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lottery_type VARCHAR(50) NOT NULL,
  issue_number VARCHAR(50) NOT NULL,
  draw_numbers INTEGER[],
  draw_date DATE,
  jackpot_amount DECIMAL(18, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lottery_type, issue_number)
);

-- 专业名词表
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  term VARCHAR(100) NOT NULL UNIQUE,
  definition TEXT,
  link_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 人物战绩表
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  win_rate DECIMAL(5, 2),
  total_orders INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  recent_orders INTEGER DEFAULT 0,
  recent_wins INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_publish_time ON news(publish_time);
CREATE INDEX IF NOT EXISTS idx_news_author ON news(author);
CREATE INDEX IF NOT EXISTS idx_news_categories_news ON news_categories(news_id);
CREATE INDEX IF NOT EXISTS idx_news_categories_category ON news_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_section_news_section ON section_news(section_id);
CREATE INDEX IF NOT EXISTS idx_keywords_word ON keywords(word);
CREATE INDEX IF NOT EXISTS idx_lottery_draws_issue ON lottery_draws(issue_number);

-- 插入初始导航数据
INSERT INTO categories (id, name, type, sort_order) VALUES 
('00000000-0000-0000-0000-000000000001', 'Web新闻', 'root', 0)
ON CONFLICT DO NOTHING;

-- 插入默认彩种类别（一级类别）
INSERT INTO categories (parent_id, name, type, sort_order) VALUES 
('00000000-0000-0000-0000-000000000001', '双色球', 'lottery', 1),
('00000000-0000-0000-0000-000000000001', '大乐透', 'lottery', 2),
('00000000-0000-0000-0000-000000000001', '福彩3D', 'lottery', 3),
('00000000-0000-0000-0000-000000000001', '排列三', 'lottery', 4),
('00000000-0000-0000-0000-000000000001', '七星彩', 'lottery', 5)
ON CONFLICT DO NOTHING;

-- 插入默认模板
INSERT INTO templates (name, type, content) VALUES 
('默认底部模板', 'bottom', '<div class="news-footer"><p>本文仅供参考，不构成投资建议。</p></div>'),
('默认列表模板', 'list', '<ul class="news-list">{{each items}}<li><a href="{{url}}">{{title}}</a><span class="date">{{date}}</span></li>{{/each}}</ul>'),
('默认详情模板', 'detail', '<article class="news-detail"><h1>{{title}}</h1><div class="meta"><span>作者：{{author}}</span><span>来源：{{source}}</span></div><div class="content">{{content}}</div></article>')
ON CONFLICT DO NOTHING;
