const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  const columns = db.prepare("PRAGMA table_info(chapters)").all();
  const hasPages = columns.some(c => c.name === 'pages');
  if (!hasPages) {
    db.exec("ALTER TABLE chapters ADD COLUMN pages TEXT");
    console.log('Migrated: added pages column to chapters');
  }

  const activityColumns = db.prepare("PRAGMA table_info(activities)").all();
  const activityFields = ['location', 'has_assignment', 'assignment_title', 'assignment_due_date', 'assignment_description', 'is_completed'];
  activityFields.forEach(field => {
    const hasField = activityColumns.some(c => c.name === field);
    if (!hasField) {
      const type = field === 'has_assignment' || field === 'is_completed' ? 'INTEGER DEFAULT 0' : 'TEXT';
      db.exec(`ALTER TABLE activities ADD COLUMN ${field} ${type}`);
      console.log(`Migrated: added ${field} column to activities`);
    }
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      avatar TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS book_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      book_title TEXT NOT NULL,
      book_author TEXT,
      book_cover TEXT,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      host_id INTEGER REFERENCES users(id),
      reading_goals TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      description TEXT,
      scheduled_date DATE,
      pages TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plan_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plan_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'in_progress',
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, chapter_id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'note',
      content TEXT NOT NULL,
      excerpt TEXT,
      page_number INTEGER,
      is_public INTEGER DEFAULT 1,
      is_essence INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discussion_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      is_essence INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discussion_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES discussion_topics(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      parent_id INTEGER REFERENCES discussion_comments(id) ON DELETE CASCADE,
      is_essence INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES discussion_topics(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      vote_type INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(topic_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES book_plans(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      scheduled_at DATETIME,
      host_id INTEGER REFERENCES users(id),
      guest_info TEXT,
      meeting_link TEXT,
      replay_link TEXT,
      materials TEXT,
      location TEXT,
      has_assignment INTEGER DEFAULT 0,
      assignment_title TEXT,
      assignment_due_date DATE,
      assignment_description TEXT,
      is_completed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'registered',
      attended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(activity_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      file_url TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_notes_plan ON notes(plan_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_topics_plan ON discussion_topics(plan_id);
    CREATE INDEX IF NOT EXISTS idx_comments_topic ON discussion_comments(topic_id);
  `);

  db.exec(`
    DELETE FROM book_plans
    WHERE id NOT IN (
      SELECT MIN(id) FROM book_plans GROUP BY title, book_title, start_date, end_date
    );
    DELETE FROM chapters
    WHERE id NOT IN (
      SELECT MIN(id) FROM chapters GROUP BY plan_id, chapter_number, title
    );
    DELETE FROM discussion_topics
    WHERE id NOT IN (
      SELECT MIN(id) FROM discussion_topics GROUP BY plan_id, chapter_id, author_id, title
    );
    DELETE FROM activities
    WHERE id NOT IN (
      SELECT MIN(id) FROM activities GROUP BY plan_id, title, type, scheduled_at
    );
  `);

  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const memberPassword = bcrypt.hashSync('member123', 10);

  const ensureUser = (username, password, name, role, email) => {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      db.prepare('UPDATE users SET name = ?, role = ?, email = ? WHERE id = ?').run(name, role, email, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO users (username, password, name, role, email)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, password, name, role, email);
    return result.lastInsertRowid;
  };

  const adminId = ensureUser('admin', adminPassword, '系统管理员', 'admin', 'admin@bookclub.com');
  const hostId = ensureUser('host1', adminPassword, '张主理人', 'host', 'host1@bookclub.com');
  const member1Id = ensureUser('member1', memberPassword, '李成员', 'member', 'member1@bookclub.com');
  const member2Id = ensureUser('member2', memberPassword, '王成员', 'member', 'member2@bookclub.com');
  const guestId = ensureUser('guest1', memberPassword, '赵嘉宾', 'guest', 'guest1@bookclub.com');

  const ensurePlan = (title, bookTitle, bookAuthor, description, startDate, endDate, hostIdValue, readingGoals, status) => {
    const existing = db.prepare('SELECT id FROM book_plans WHERE title = ? AND book_title = ?').get(title, bookTitle);
    if (existing) {
      db.prepare(`
        UPDATE book_plans
        SET book_author = ?, description = ?, start_date = ?, end_date = ?, host_id = ?, reading_goals = ?, status = ?
        WHERE id = ?
      `).run(bookAuthor, description, startDate, endDate, hostIdValue, readingGoals, status, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO book_plans (title, book_title, book_author, description, start_date, end_date, host_id, reading_goals, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, bookTitle, bookAuthor, description, startDate, endDate, hostIdValue, readingGoals, status);
    return result.lastInsertRowid;
  };

  const planId = ensurePlan(
    '《原则》深度共读',
    '原则',
    '瑞·达利欧',
    '一起深入研读桥水基金创始人瑞·达利欧的经典著作《原则》，探索生活和工作的基本原则。',
    '2024-01-15',
    '2024-03-15',
    hostId,
    '每周完成1-2章阅读，撰写读书笔记，参与线上讨论，并在活动后沉淀精华观点。',
    'active'
  );

  const ensureChapter = (chapterNumber, title, description, scheduledDate, pages = null) => {
    const existing = db.prepare('SELECT id FROM chapters WHERE plan_id = ? AND chapter_number = ?').get(planId, chapterNumber);
    if (existing) {
      db.prepare('UPDATE chapters SET title = ?, description = ?, scheduled_date = ?, pages = ? WHERE id = ?')
        .run(title, description, scheduledDate, pages, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO chapters (plan_id, title, chapter_number, description, scheduled_date, pages)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(planId, title, chapterNumber, description, scheduledDate, pages);
    return result.lastInsertRowid;
  };

  const chapter1Id = ensureChapter(1, '导言：我的历程', '了解作者的背景和本书的由来', '2024-01-15', '1-45');
  const chapter2Id = ensureChapter(2, '第一部分：我的探险召唤', '从1到12章，探索作者的早期经历', '2024-01-22', '46-120');
  const chapter3Id = ensureChapter(3, '第二部分：生活原则', '拥抱现实，应对现实', '2024-01-29', '121-210');
  const chapter4Id = ensureChapter(4, '第三部分：工作原则', '打造良好的文化', '2024-02-05', '211-350');

  const memberStmt = db.prepare('INSERT OR IGNORE INTO plan_members (plan_id, user_id, role) VALUES (?, ?, ?)');
  memberStmt.run(planId, hostId, 'host');
  memberStmt.run(planId, member1Id, 'member');
  memberStmt.run(planId, member2Id, 'member');
  memberStmt.run(planId, guestId, 'guest');
  memberStmt.run(planId, adminId, 'host');

  const ensureProgress = (userId, chapterId, status, completedAt) => {
    const existing = db.prepare('SELECT id FROM reading_progress WHERE user_id = ? AND chapter_id = ?').get(userId, chapterId);
    if (existing) {
      db.prepare('UPDATE reading_progress SET plan_id = ?, status = ?, completed_at = ? WHERE id = ?')
        .run(planId, status, completedAt, existing.id);
      return;
    }
    db.prepare(`
      INSERT INTO reading_progress (user_id, plan_id, chapter_id, status, completed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, planId, chapterId, status, completedAt);
  };
  ensureProgress(member1Id, chapter1Id, 'completed', '2024-01-16 21:05:00');
  ensureProgress(member1Id, chapter2Id, 'completed', '2024-01-23 21:20:00');
  ensureProgress(member2Id, chapter1Id, 'completed', '2024-01-17 20:12:00');
  ensureProgress(member2Id, chapter2Id, 'in_progress', null);
  ensureProgress(guestId, chapter1Id, 'completed', '2024-01-18 19:30:00');

  const ensureNote = (userId, chapterId, type, content, excerpt, pageNumber, isPublic, isEssence = 0) => {
    const existing = db.prepare('SELECT id FROM notes WHERE user_id = ? AND chapter_id = ? AND content = ?').get(userId, chapterId, content);
    if (existing) {
      db.prepare('UPDATE notes SET type = ?, excerpt = ?, page_number = ?, is_public = ?, is_essence = ? WHERE id = ?')
        .run(type, excerpt, pageNumber, isPublic ? 1 : 0, isEssence ? 1 : 0, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO notes (user_id, plan_id, chapter_id, type, content, excerpt, page_number, is_public, is_essence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, planId, chapterId, type, content, excerpt, pageNumber, isPublic ? 1 : 0, isEssence ? 1 : 0);
    return result.lastInsertRowid;
  };
  ensureNote(member1Id, chapter1Id, 'thought', '把痛苦事件拆成事实、选择和原则三层后，讨论会更聚焦，也更容易形成行动清单。', '痛苦 + 反思 = 进步', 37, true, 1);
  ensureNote(member2Id, chapter2Id, 'question', '创意择优需要透明数据支撑，如果团队没有记录决策过程，是否会演变成少数人拍板？', '可信度加权决策', 89, true, 0);
  ensureNote(guestId, chapter1Id, 'excerpt', '嘉宾建议把章节问题提前收集，分享会优先回应高票问题。', '让观点先被看见，再被讨论。', 42, true, 0);

  const ensureCheckIn = (userId, chapterId, note) => {
    const existing = db.prepare('SELECT id FROM check_ins WHERE user_id = ? AND chapter_id = ? AND note = ?').get(userId, chapterId, note);
    if (!existing) {
      db.prepare('INSERT INTO check_ins (user_id, plan_id, chapter_id, note) VALUES (?, ?, ?, ?)')
        .run(userId, planId, chapterId, note);
    }
  };
  ensureCheckIn(member1Id, chapter1Id, '完成导言阅读，已提交公开笔记。');
  ensureCheckIn(member1Id, chapter2Id, '补充了关于探险召唤的复盘问题。');
  ensureCheckIn(member2Id, chapter1Id, '完成第一章，准备在讨论区追问创意择优机制。');
  ensureCheckIn(guestId, chapter1Id, '已阅读并准备分享会资料。');

  const ensureTopic = (chapterId, authorId, title, content, isPinned = 0, isEssence = 0, viewCount = 0) => {
    const existing = db.prepare('SELECT id FROM discussion_topics WHERE plan_id = ? AND title = ?').get(planId, title);
    if (existing) {
      db.prepare('UPDATE discussion_topics SET chapter_id = ?, author_id = ?, content = ?, is_pinned = ?, is_essence = ?, view_count = ? WHERE id = ?')
        .run(chapterId, authorId, content, isPinned ? 1 : 0, isEssence ? 1 : 0, viewCount, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO discussion_topics (plan_id, chapter_id, author_id, title, content, is_pinned, is_essence, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(planId, chapterId, authorId, title, content, isPinned ? 1 : 0, isEssence ? 1 : 0, viewCount);
    return result.lastInsertRowid;
  };
  const topic1Id = ensureTopic(chapter1Id, hostId, '【必读】第一章讨论：你如何理解"痛苦+反思=进步"？', '欢迎大家分享对第一章核心观点的理解和思考，尤其是最近一次从反馈中提炼原则的经历。', 1, 1, 38);
  const topic2Id = ensureTopic(chapter1Id, member1Id, '关于桥水基金的创意择优机制', '创意择优听起来很理想，但在实际工作中真的可行吗？我想听听大家对透明反馈和心理安全感的看法。', 0, 0, 21);

  const ensureComment = (topicId, authorId, content, isEssence = 0) => {
    const existing = db.prepare('SELECT id FROM discussion_comments WHERE topic_id = ? AND author_id = ? AND content = ?').get(topicId, authorId, content);
    if (existing) {
      db.prepare('UPDATE discussion_comments SET is_essence = ? WHERE id = ?').run(isEssence ? 1 : 0, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO discussion_comments (topic_id, author_id, content, is_essence)
      VALUES (?, ?, ?, ?)
    `).run(topicId, authorId, content, isEssence ? 1 : 0);
    return result.lastInsertRowid;
  };
  ensureComment(topic1Id, member1Id, '我把这句话理解成复盘机制：先承认痛苦，再把原因写下来，最后沉淀可执行原则。', 1);
  ensureComment(topic1Id, guestId, '分享会可以把大家的案例按“事实-判断-原则”三列整理，方便后续复查。', 0);
  ensureComment(topic2Id, hostId, '可以先从小范围章节复盘试点，要求每次讨论都有主持人记录结论和待验证假设。', 0);

  const voteStmt = db.prepare('INSERT OR IGNORE INTO votes (topic_id, user_id, vote_type) VALUES (?, ?, ?)');
  voteStmt.run(topic1Id, member1Id, 1);
  voteStmt.run(topic1Id, member2Id, 1);
  voteStmt.run(topic1Id, guestId, 1);
  voteStmt.run(topic2Id, hostId, 1);

  const ensureActivity = (title, type, description, scheduledAt, hostIdValue, guestInfo, meetingLink, replayLink, materials, status) => {
    const existing = db.prepare('SELECT id FROM activities WHERE plan_id = ? AND title = ?').get(planId, title);
    if (existing) {
      db.prepare(`
        UPDATE activities
        SET type = ?, description = ?, scheduled_at = ?, host_id = ?, guest_info = ?, meeting_link = ?, replay_link = ?, materials = ?, status = ?
        WHERE id = ?
      `).run(type, description, scheduledAt, hostIdValue, guestInfo, meetingLink, replayLink, materials, status, existing.id);
      return existing.id;
    }
    const result = db.prepare(`
      INSERT INTO activities (plan_id, title, type, description, scheduled_at, host_id, guest_info, meeting_link, replay_link, materials, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(planId, title, type, description, scheduledAt, hostIdValue, guestInfo, meetingLink, replayLink, materials, status);
    return result.lastInsertRowid;
  };
  const sharingActivityId = ensureActivity(
    '第一章线上分享会',
    'sharing',
    '第一章阅读心得分享，邀请嘉宾赵老师深度解读，并沉淀本周精华观点。',
    '2024-01-20 20:00:00',
    hostId,
    '赵嘉宾：某知名企业HR总监',
    'https://meeting.example.com/123456',
    'https://replay.example.com/principles-01',
    'https://docs.example.com/principles-week1',
    'scheduled'
  );
  const assignmentActivityId = ensureActivity(
    '第二章作业收集',
    'assignment',
    '提交第二章阅读复盘：列出一个近期决策案例，并提炼可复用原则。',
    '2024-01-27 21:00:00',
    hostId,
    '',
    '',
    '',
    'https://docs.example.com/principles-assignment-02',
    'scheduled'
  );

  const ensureAttendee = (activityId, userId, status, attendedAt = null) => {
    const existing = db.prepare('SELECT id FROM activity_attendees WHERE activity_id = ? AND user_id = ?').get(activityId, userId);
    if (existing) {
      db.prepare('UPDATE activity_attendees SET status = ?, attended_at = ? WHERE id = ?').run(status, attendedAt, existing.id);
      return;
    }
    db.prepare('INSERT INTO activity_attendees (activity_id, user_id, status, attended_at) VALUES (?, ?, ?, ?)')
      .run(activityId, userId, status, attendedAt);
  };
  ensureAttendee(sharingActivityId, member1Id, 'attended', '2024-01-20 21:10:00');
  ensureAttendee(sharingActivityId, member2Id, 'registered', null);
  ensureAttendee(sharingActivityId, guestId, 'attended', '2024-01-20 21:10:00');
  ensureAttendee(assignmentActivityId, member1Id, 'registered', null);

  const ensureAssignment = (activityId, userId, content) => {
    const existing = db.prepare('SELECT id FROM assignments WHERE activity_id = ? AND user_id = ? AND content = ?').get(activityId, userId, content);
    if (!existing) {
      db.prepare('INSERT INTO assignments (activity_id, user_id, content, file_url) VALUES (?, ?, ?, ?)')
        .run(activityId, userId, content, 'https://docs.example.com/member1-principles-homework');
    }
  };
  ensureAssignment(assignmentActivityId, member1Id, '本周作业：把一次项目复盘拆解为事实、原因、原则和下次行动四部分。');

  console.log('Database initialized successfully');
}

initDatabase();

module.exports = db;
