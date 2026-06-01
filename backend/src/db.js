import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    research_goal TEXT NOT NULL DEFAULT '',
    target_user TEXT NOT NULL DEFAULT '',
    task_script TEXT NOT NULL DEFAULT '',
    prototype_link TEXT NOT NULL DEFAULT '',
    schedule_start TEXT NOT NULL DEFAULT '',
    schedule_end TEXT NOT NULL DEFAULT '',
    compensation TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    screening_answers TEXT NOT NULL DEFAULT '[]',
    appointment_status TEXT NOT NULL DEFAULT 'pending',
    consent_given INTEGER NOT NULL DEFAULT 0,
    participation_history TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    participant_id INTEGER NOT NULL,
    scheduled_at TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'scheduled',
    recording_status TEXT NOT NULL DEFAULT 'off',
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (participant_id) REFERENCES participants(id)
  );

  CREATE TABLE IF NOT EXISTS task_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    session_id INTEGER,
    step_order INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    expected_action TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    timestamp_seconds INTEGER NOT NULL DEFAULT 0,
    note_type TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL DEFAULT '',
    is_stuck_point INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    session_id INTEGER,
    observation_id INTEGER,
    category TEXT NOT NULL DEFAULT 'other',
    severity TEXT NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL DEFAULT '',
    video_timestamp INTEGER NOT NULL DEFAULT 0,
    video_clip_url TEXT NOT NULL DEFAULT '',
    resolution TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (observation_id) REFERENCES observations(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    task_completion_rate REAL NOT NULL DEFAULT 0,
    avg_time_seconds INTEGER NOT NULL DEFAULT 0,
    top_issues TEXT NOT NULL DEFAULT '[]',
    improvement_suggestions TEXT NOT NULL DEFAULT '[]',
    follow_up_plan TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

const existingProjects = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
if (existingProjects === 0) {
  const projectId = db.prepare(
    `INSERT INTO projects (name, research_goal, target_user, task_script, prototype_link, schedule_start, schedule_end, compensation, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    '移动端注册流程可用性测试',
    '验证新用户从落地页到完成注册的关键路径是否清晰，定位阻塞步骤，识别信息架构中理解偏差和导航卡点，评估表单交互体验。',
    '最近 3 个月内尝试过 2 款以上同类效率工具、18-35 岁的个人用户，iOS/Android 各半。',
    '任务脚本：\n1. 打开产品首页，观察信息接收\n2. 找到并点击「免费试用」\n3. 完成邮箱注册与密码设置\n4. 通过手机验证码\n5. 选择个人/团队版本\n6. 完成基础资料填写\n7. 进入首页后找到「邀请同事」入口\n8. 退出后重新登录验证',
    'https://www.figma.com/proto/demo/signup-flow?page-id=0%3A1&node-id=1-2&viewport=241%2C48%2C0.5&scaling=scale-down',
    '2026-06-01 10:00',
    '2026-06-05 18:00',
    '¥200 京东礼品卡 + 3 个月高级版会员',
    'active'
  ).lastInsertRowid;

  const insertParticipant = db.prepare(
    `INSERT INTO participants (project_id, name, email, phone, screening_answers, appointment_status, consent_given, participation_history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const p1 = insertParticipant.run(
    projectId, '林晓雨', 'xiaoyu.lin@example.com', '13800000001',
    JSON.stringify([
      '每周使用效率工具 3 次以上',
      '使用过 Notion / 飞书 / 语雀',
      '愿意录制屏幕和语音',
      '使用 iOS 系统',
      '25-30 岁区间'
    ]),
    'completed', 1,
    JSON.stringify(['2026-03 首页导航测试', '2026-04 搜索功能测试', '2026-05 注册流程测试'])
  ).lastInsertRowid;

  const p2 = insertParticipant.run(
    projectId, '周明', 'ming.zhou@example.com', '13800000002',
    JSON.stringify([
      '首次接触这类产品',
      '偏好视频电话访谈',
      '对隐私敏感',
      '使用 Android 系统',
      '22-24 岁区间'
    ]),
    'confirmed', 1,
    JSON.stringify(['2026-04 竞品对比测试'])
  ).lastInsertRowid;

  const p3 = insertParticipant.run(
    projectId, '张思琪', 'siqi.zhang@example.com', '13800000003',
    JSON.stringify([
      '每天使用效率工具',
      '愿意录制，曾参与过 5 次以上用户测试',
      '同时使用 iOS 和 Android',
      '31-35 岁区间'
    ]),
    'confirmed', 1,
    JSON.stringify(['2025-12 定价页测试', '2026-01 空状态测试', '2026-02 引导页测试', '2026-03 分享功能测试'])
  ).lastInsertRowid;

  const p4 = insertParticipant.run(
    projectId, '王浩然', 'haoran.wang@example.com', '13800000004',
    JSON.stringify([
      '偶尔使用效率工具',
      '不愿意录屏但接受语音',
      '使用 iOS 系统',
      '18-21 岁区间'
    ]),
    'pending', 0,
    JSON.stringify([])
  ).lastInsertRowid;

  const p5 = insertParticipant.run(
    projectId, '陈雨婷', 'yuting.chen@example.com', '13800000005',
    JSON.stringify([
      '每周使用 1-2 次',
      '愿意录制，有 1 年用户测试经验',
      '使用 Android 系统',
      '25-30 岁区间'
    ]),
    'cancelled', 1,
    JSON.stringify(['2026-03 首页导航测试'])
  ).lastInsertRowid;

  const insertSession = db.prepare(
    `INSERT INTO sessions (project_id, participant_id, scheduled_at, status, recording_status, started_at, ended_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const s1 = insertSession.run(
    projectId, p1, '2026-06-02 14:00', 'completed', 'on',
    '2026-06-02 14:02:15', '2026-06-02 14:58:42'
  ).lastInsertRowid;

  const s2 = insertSession.run(
    projectId, p2, '2026-06-03 10:00', 'in_progress', 'recording',
    '2026-06-03 10:01:30', null
  ).lastInsertRowid;

  const s3 = insertSession.run(
    projectId, p3, '2026-06-04 15:30', 'scheduled', 'off',
    null, null
  ).lastInsertRowid;

  const insertTask = db.prepare(
    `INSERT INTO task_steps (project_id, session_id, step_order, title, description, expected_action, completed, time_spent_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const tasksS1 = [
    [s1, 1, '打开产品首页', '在手机中找到并打开被测 App，观察落地页信息。', '识别主 CTA 并理解价值主张', 1, 18],
    [s1, 2, '找到注册入口', '从首页找到开始使用的方式。', '点击「免费试用」主按钮', 1, 42],
    [s1, 3, '填写邮箱与密码', '在注册页输入邮箱、设置密码并阅读条款。', '输入邮箱、密码，勾选同意后提交', 1, 115],
    [s1, 4, '完成手机验证', '输入收到的 6 位短信验证码。', '在 60 秒内正确输入验证码', 1, 83],
    [s1, 5, '选择使用版本', '在个人版和团队版中做出选择。', '明确版本差异后选择个人版', 0, 142],
    [s1, 6, '填写基础资料', '补充姓名、行业、公司规模等信息。', '完成必填项后跳过可选信息', 0, 0],
    [s1, 7, '找到邀请入口', '进入产品后找到邀请同事的功能。', '从侧边栏或个人中心定位「邀请」入口', 0, 0]
  ];

  for (const task of tasksS1) {
    insertTask.run(projectId, ...task);
  }

  const tasksS2 = [
    [s2, 1, '打开产品首页', '在手机中找到并打开被测 App。', '识别主 CTA', 1, 25],
    [s2, 2, '找到注册入口', '从首页找到开始使用的方式。', '点击「免费试用」', 1, 58],
    [s2, 3, '填写邮箱与密码', '在注册页输入信息。', '提交注册表单', 0, 135]
  ];

  for (const task of tasksS2) {
    insertTask.run(projectId, ...task);
  }

  const insertObservation = db.prepare(
    `INSERT INTO observations (session_id, project_id, timestamp_seconds, note_type, content, is_stuck_point)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const obsS1 = [
    [35, 'general', '参与者打开 App 后先看评论区，停留约 20 秒才关注主区域。', 0],
    [42, 'general', '主按钮文案「免费试用」理解清晰，无犹豫直接点击。', 0],
    [78, 'friction', '密码强度指示器只有颜色变化没有文字说明，参与者反复尝试。', 1],
    [115, 'error', '参与者连续 2 次输错邮箱格式（忘记加 @），但错误提示不明显。', 1],
    [142, 'feedback', '用户认为「服务条款」链接放按钮旁边比放在页脚更容易注意到。', 0],
    [168, 'friction', '验证码倒计时结束后，「重新发送」按钮灰态 3 秒，用户以为卡死。', 1],
    [215, 'comprehension', '「个人版」vs「团队版」说明中，「无限成员」表述让用户误以为个人版有人数限制。', 1],
    [258, 'feedback', '用户希望在版本选择页能看到价格对比，而不是跳转到新页面。', 0],
    [302, 'insight', '注册完成后用户反复看「开始使用」按钮，不确定下一步该做什么。', 1],
    [345, 'feedback', '用户期望注册成功后有引导动画或功能介绍，而不是直接进入空白首页。', 0]
  ];

  for (const obs of obsS1) {
    insertObservation.run(s1, projectId, obs[0], obs[1], obs[2], obs[3]);
  }

  const obsS2 = [
    [28, 'general', '用户先划动 3 屏引导才看到首页。', 0],
    [55, 'comprehension', '用户误以为底部「登录」是唯一入口，错过中部的「免费试用」。', 1],
    [120, 'error', '用户在邮箱字段输入了手机号，表单未实时校验。', 1]
  ];

  for (const obs of obsS2) {
    insertObservation.run(s2, projectId, obs[0], obs[1], obs[2], obs[3]);
  }

  const insertIssue = db.prepare(
    `INSERT INTO issues (project_id, session_id, observation_id, category, severity, description, video_timestamp, video_clip_url, resolution, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const issues = [
    [s1, 3, 'form', 'high', '密码强度指示器只有颜色变化，缺少文字说明，导致用户反复调整密码仍不确定是否合规。', 78,
     'https://assets.example.com/clips/clip-1-password-78s.mp4',
     '在指示器旁添加「弱 / 中 / 强」文字标签，并列出密码要求清单。', 'open'],
    [s1, 4, 'form', 'medium', '邮箱格式校验不实时，用户提交后才看到错误提示，需要重新填写。', 115,
     'https://assets.example.com/clips/clip-2-email-115s.mp4',
     '添加邮箱格式实时校验，在输入时即时提示。', 'open'],
    [s1, 6, 'interaction', 'high', '验证码重新发送按钮在倒计时结束后仍有 3 秒灰态，用户误以为页面卡死。', 168,
     'https://assets.example.com/clips/clip-3-resend-168s.mp4',
     '倒计时结束后立即启用按钮，并添加「发送成功」toast 反馈。', 'resolved'],
    [s1, 7, 'content', 'medium', '版本选择页「无限成员」表述歧义，用户误以为个人版有人数限制。', 215,
     'https://assets.example.com/clips/clip-4-version-215s.mp4',
     '改为「个人版：仅自己使用」「团队版：最多 100 人」清晰表述。', 'open'],
    [s1, 9, 'navigation', 'critical', '注册完成后直接进入空白首页，缺少引导，用户不知所措反复点击。', 302,
     'https://assets.example.com/clips/clip-5-onboarding-302s.mp4',
     '注册完成后展示 3 步功能引导或「创建第一个项目」空状态。', 'open'],
    [s2, 11, 'navigation', 'high', '底部「登录」按钮视觉权重高于中部「免费试用」，新用户误点登录流程。', 55,
     'https://assets.example.com/clips/clip-6-cta-55s.mp4',
     '强化中部 CTA 视觉权重，或在登录页添加「还没有账号？注册」入口。', 'open'],
    [s2, 12, 'form', 'medium', '邮箱字段未限制输入类型，用户可能误输入手机号。', 120,
     'https://assets.example.com/clips/clip-7-mobile-120s.mp4',
     '添加输入类型检测，手机号输入时提示「请输入邮箱」。', 'closed'],
    [s1, null, 'suggestion', 'low', '用户建议注册页添加「用微信/Apple 登录」第三方登录选项。', 0,
     '',
     '评估第三方登录开发成本与用户需求匹配度。', 'open']
  ];

  for (const issue of issues) {
    insertIssue.run(projectId, issue[0], issue[1], issue[2], issue[3], issue[4], issue[5], issue[6], issue[7], issue[8]);
  }

  db.prepare(
    `INSERT INTO reports (project_id, title, task_completion_rate, avg_time_seconds, top_issues, improvement_suggestions, follow_up_plan)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    projectId,
    '注册流程第一轮可用性测试报告',
    0.43,
    132,
    JSON.stringify([
      '导航 - 注册完成后缺少引导（严重×1）',
      '表单 - 密码强度指示器缺少文字说明（高×2）',
      '导航 - 首页 CTA 权重失衡导致误点登录（高×1）',
      '交互 - 验证码重发按钮灰态误导（高×1，已解决）',
      '内容 - 版本选择表述歧义（中×1）'
    ]),
    JSON.stringify([
      '为密码强度指示器添加「弱/中/强」文字标签和具体要求说明',
      '在注册完成后增加 3 步功能引导或「创建第一个项目」空状态',
      '重新设计首页 CTA 布局，强化「免费试用」视觉权重',
      '将「个人版/团队版」的表述改为清晰的人数限制说明',
      '在邮箱字段添加实时格式校验，避免用户提交后才看到错误'
    ]),
    '当前已完成 2 场测试（目标 5 场）。建议优先修复 P0 问题（注册后引导、密码指示器、首页 CTA），完成改版后追加 3 名新用户复测。若复测完成率提升至 80% 以上，可进入下一轮「邀请同事」功能专项测试。'
  );
}

export default db;
