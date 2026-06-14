const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imdb_id TEXT UNIQUE,
      tmdb_id TEXT UNIQUE,
      title TEXT NOT NULL,
      original_title TEXT,
      year INTEGER,
      release_date DATE,
      runtime INTEGER,
      rating REAL DEFAULT 0,
      vote_count INTEGER DEFAULT 0,
      genres TEXT,
      countries TEXT,
      languages TEXT,
      director TEXT,
      writers TEXT,
      plot TEXT,
      poster_url TEXT,
      backdrop_url TEXT,
      trailer_url TEXT,
      content_rating TEXT,
      status TEXT DEFAULT 'active',
      source TEXT,
      source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tv_shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imdb_id TEXT UNIQUE,
      tmdb_id TEXT UNIQUE,
      title TEXT NOT NULL,
      original_title TEXT,
      start_year INTEGER,
      end_year INTEGER,
      status TEXT,
      seasons INTEGER DEFAULT 0,
      episodes INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      vote_count INTEGER DEFAULT 0,
      genres TEXT,
      countries TEXT,
      languages TEXT,
      creator TEXT,
      plot TEXT,
      poster_url TEXT,
      backdrop_url TEXT,
      trailer_url TEXT,
      content_rating TEXT,
      active_status TEXT DEFAULT 'active',
      source TEXT,
      source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tv_show_id INTEGER NOT NULL,
      season_number INTEGER NOT NULL,
      title TEXT,
      air_date DATE,
      episode_count INTEGER DEFAULT 0,
      poster_url TEXT,
      plot TEXT,
      FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tv_show_id INTEGER NOT NULL,
      season_id INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title TEXT,
      air_date DATE,
      runtime INTEGER,
      rating REAL DEFAULT 0,
      plot TEXT,
      still_url TEXT,
      FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE CASCADE,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imdb_id TEXT UNIQUE,
      tmdb_id TEXT UNIQUE,
      name TEXT NOT NULL,
      original_name TEXT,
      birth_date DATE,
      death_date DATE,
      place_of_birth TEXT,
      gender INTEGER DEFAULT 0,
      biography TEXT,
      avatar_url TEXT,
      known_for TEXT,
      popularity REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movie_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      person_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      job TEXT,
      character TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      UNIQUE(movie_id, person_id, department, job, character)
    );

    CREATE TABLE IF NOT EXISTS tv_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tv_show_id INTEGER NOT NULL,
      person_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      job TEXT,
      character TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE CASCADE,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      UNIQUE(tv_show_id, person_id, department, job, character)
    );

    CREATE TABLE IF NOT EXISTS person_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person1_id INTEGER NOT NULL,
      person2_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL,
      movie_id INTEGER,
      tv_show_id INTEGER,
      collaboration_count INTEGER DEFAULT 1,
      FOREIGN KEY (person1_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (person2_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL,
      FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) ON DELETE SET NULL,
      UNIQUE(person1_id, person2_id, relation_type)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      rating REAL NOT NULL,
      sentiment_score REAL DEFAULT 0,
      sentiment_label TEXT DEFAULT 'neutral',
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      moderation_note TEXT,
      moderated_by INTEGER,
      moderated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      is_public INTEGER DEFAULT 1,
      item_count INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      UNIQUE(playlist_id, content_type, content_id)
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      news_type TEXT NOT NULL,
      source TEXT,
      source_url TEXT,
      related_movie_id INTEGER,
      related_person_id INTEGER,
      publish_date DATETIME,
      image_url TEXT,
      views INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (related_movie_id) REFERENCES movies(id) ON DELETE SET NULL,
      FOREIGN KEY (related_person_id) REFERENCES people(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      cover_url TEXT,
      creator_id INTEGER NOT NULL,
      member_count INTEGER DEFAULT 0,
      post_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topic_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(topic_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      likes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS viewing_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      creator_id INTEGER NOT NULL,
      movie_id INTEGER,
      scheduled_at DATETIME,
      location TEXT,
      max_members INTEGER DEFAULT 50,
      member_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS viewing_group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES viewing_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS battles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      topic_a TEXT NOT NULL,
      topic_b TEXT NOT NULL,
      cover_url TEXT,
      creator_id INTEGER NOT NULL,
      votes_a INTEGER DEFAULT 0,
      votes_b INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      start_time DATETIME,
      end_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS battle_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battle_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote_side TEXT NOT NULL,
      argument TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(battle_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS live_streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      streamer_id INTEGER NOT NULL,
      movie_id INTEGER,
      room_id TEXT UNIQUE,
      stream_url TEXT,
      cover_url TEXT,
      start_time DATETIME,
      end_time DATETIME,
      viewer_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled',
      is_copyright_verified INTEGER DEFAULT 0,
      copyright_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (streamer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS video_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      quality TEXT,
      language TEXT,
      is_official INTEGER DEFAULT 0,
      copyright_status TEXT DEFAULT 'pending',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      difficulty TEXT DEFAULT 'medium',
      question_count INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      time_limit INTEGER DEFAULT 600,
      cover_url TEXT,
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'single',
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      points INTEGER DEFAULT 10,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER,
      total_score INTEGER DEFAULT 0,
      quizzes_completed INTEGER DEFAULT 0,
      accuracy_rate REAL DEFAULT 0,
      rank INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS prizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      prize_type TEXT DEFAULT 'virtual',
      value REAL DEFAULT 0,
      required_score INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prize_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      prize_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      redemption_code TEXT,
      shipping_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS moderation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      moderator_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS person_edit_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS user_watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      status TEXT DEFAULT 'watchlist',
      rating REAL,
      watch_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, content_type, content_id)
    );

    CREATE TABLE IF NOT EXISTS user_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    );

    CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
    CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
    CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);
    CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
    CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews(content_type, content_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_news_type ON news(news_type);
    CREATE INDEX IF NOT EXISTS idx_news_date ON news(publish_date);
    CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
    CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(total_score DESC);
  `);
}

module.exports = {
  db,
  initDatabase
};
