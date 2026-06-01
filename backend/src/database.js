const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'psychologist', 'teacher', 'student')),
      grade INTEGER,
      class TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      questions TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      scoring_rules TEXT NOT NULL,
      risk_thresholds TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      scale_id INTEGER REFERENCES scales(id),
      grades TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      is_anonymous BOOLEAN DEFAULT 0,
      consent_text TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES assessment_plans(id),
      student_id INTEGER REFERENCES users(id),
      anonymous_id TEXT UNIQUE,
      answers TEXT,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'incomplete' CHECK(status IN ('incomplete', 'submitted', 'abnormal')),
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      submit_time DATETIME,
      duration_seconds INTEGER,
      abnormal_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER REFERENCES assessment_records(id),
      total_score REAL,
      dimension_scores TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('normal', 'mild', 'moderate', 'severe')),
      risk_factors TEXT,
      analysis_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id),
      result_id INTEGER REFERENCES assessment_results(id),
      type TEXT NOT NULL CHECK(type IN ('interview', 'referral', 'parent_communication', 'follow_up')),
      content TEXT NOT NULL,
      outcome TEXT,
      created_by INTEGER REFERENCES users(id),
      is_closed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      related_id INTEGER,
      assignee_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'done')),
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES assessment_plans(id),
      student_id INTEGER REFERENCES users(id),
      anonymous_id TEXT,
      consented BOOLEAN DEFAULT 0,
      consented_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_records_student ON assessment_records(student_id);
    CREATE INDEX IF NOT EXISTS idx_records_plan ON assessment_records(plan_id);
    CREATE INDEX IF NOT EXISTS idx_results_risk ON assessment_results(risk_level);
    CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id);
    CREATE INDEX IF NOT EXISTS idx_todos_assignee ON todos(assignee_id);
  `);

  const bcrypt = require('bcryptjs');
  
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
  if (adminCheck.get('admin').count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)')
      .run('admin', hash, '系统管理员', 'admin');
    
    const psychHash = bcrypt.hashSync('psych123', 10);
    db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)')
      .run('psych01', psychHash, '张老师', 'psychologist');
    
    const teacherHash = bcrypt.hashSync('teacher123', 10);
    db.prepare('INSERT INTO users (username, password, name, role, grade, class) VALUES (?, ?, ?, ?, ?, ?)')
      .run('teacher01', teacherHash, '李班主任', 'teacher', 7, '1班');
    
    const studentHash = bcrypt.hashSync('student123', 10);
    db.prepare('INSERT INTO users (username, password, name, role, grade, class) VALUES (?, ?, ?, ?, ?, ?)')
      .run('student01', studentHash, '王小明', 'student', 7, '1班');
    db.prepare('INSERT INTO users (username, password, name, role, grade, class) VALUES (?, ?, ?, ?, ?, ?)')
      .run('student02', studentHash, '刘小红', 'student', 7, '1班');
    db.prepare('INSERT INTO users (username, password, name, role, grade, class) VALUES (?, ?, ?, ?, ?, ?)')
      .run('student03', studentHash, '张小强', 'student', 8, '2班');
    db.prepare('INSERT INTO users (username, password, name, role, grade, class) VALUES (?, ?, ?, ?, ?, ?)')
      .run('student04', studentHash, '陈小丽', 'student', 7, '1班');
  }

  const scaleCheck = db.prepare('SELECT COUNT(*) as count FROM scales');
  if (scaleCheck.get().count === 0) {
    const phq9Questions = JSON.stringify([
      { id: 1, text: '做事时提不起劲或没有兴趣', dimension: 'depression' },
      { id: 2, text: '感到心情低落、沮丧或绝望', dimension: 'depression' },
      { id: 3, text: '入睡困难、睡不安稳或睡眠过多', dimension: 'sleep' },
      { id: 4, text: '感到疲倦或没有活力', dimension: 'energy' },
      { id: 5, text: '食欲不振或吃太多', dimension: 'appetite' },
      { id: 6, text: '觉得自己很糟，或觉得自己很失败', dimension: 'self_esteem' },
      { id: 7, text: '难以集中注意力，例如看报纸或看电视', dimension: 'concentration' },
      { id: 8, text: '动作或说话缓慢到别人可以察觉？或相反——比平时更加烦躁或坐立不安', dimension: 'psychomotor' },
      { id: 9, text: '有不如死掉或用某种方式伤害自己的念头', dimension: 'suicide' }
    ]);
    
    const phq9Dimensions = JSON.stringify({
      depression: '抑郁情绪',
      sleep: '睡眠问题',
      energy: '精力水平',
      appetite: '食欲问题',
      self_esteem: '自我评价',
      concentration: '注意力',
      psychomotor: '精神运动',
      suicide: '自伤倾向'
    });
    
    const phq9Scoring = JSON.stringify({
      method: 'sum',
      optionValues: [0, 1, 2, 3],
      optionLabels: ['完全不会', '几天', '一半以上天数', '几乎每天']
    });
    
    const phq9Thresholds = JSON.stringify({
      normal: { min: 0, max: 4 },
      mild: { min: 5, max: 9 },
      moderate: { min: 10, max: 14 },
      severe: { min: 15, max: 27 }
    });
    
    db.prepare('INSERT INTO scales (name, description, questions, dimensions, scoring_rules, risk_thresholds, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(
        'PHQ-9 抑郁症筛查量表',
        '患者健康问卷-9项（PHQ-9）是一个简短的自我报告问卷，用于筛查、诊断、监测和测量抑郁症的严重程度。',
        phq9Questions,
        phq9Dimensions,
        phq9Scoring,
        phq9Thresholds,
        2
      );

    const gad7Questions = JSON.stringify([
      { id: 1, text: '感到紧张、焦虑或急切', dimension: 'anxiety' },
      { id: 2, text: '不能停止或控制担忧', dimension: 'worry' },
      { id: 3, text: '对各种各样的事情担忧过多', dimension: 'worry' },
      { id: 4, text: '很难放松下来', dimension: 'relaxation' },
      { id: 5, text: '非常焦躁以至于难以静坐', dimension: 'restlessness' },
      { id: 6, text: '变得容易烦恼或急躁', dimension: 'irritability' },
      { id: 7, text: '感到似乎将有可怕的事情发生而害怕', dimension: 'fear' }
    ]);
    
    const gad7Dimensions = JSON.stringify({
      anxiety: '焦虑情绪',
      worry: '过度担忧',
      relaxation: '放松困难',
      restlessness: '坐立不安',
      irritability: '易怒',
      fear: '恐惧感'
    });
    
    const gad7Scoring = JSON.stringify({
      method: 'sum',
      optionValues: [0, 1, 2, 3],
      optionLabels: ['完全不会', '几天', '一半以上天数', '几乎每天']
    });
    
    const gad7Thresholds = JSON.stringify({
      normal: { min: 0, max: 4 },
      mild: { min: 5, max: 9 },
      moderate: { min: 10, max: 14 },
      severe: { min: 15, max: 21 }
    });
    
    db.prepare('INSERT INTO scales (name, description, questions, dimensions, scoring_rules, risk_thresholds, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(
        'GAD-7 焦虑症筛查量表',
        '广泛性焦虑障碍7项量表（GAD-7）是一个简短的自我报告问卷，用于筛查和测量焦虑的严重程度。',
        gad7Questions,
        gad7Dimensions,
        gad7Scoring,
        gad7Thresholds,
        2
      );

    const sasQuestions = JSON.stringify([
      { id: 1, text: '我觉得比平常容易紧张和着急', dimension: 'anxiety' },
      { id: 2, text: '我无缘无故地感到害怕', dimension: 'fear' },
      { id: 3, text: '我容易心里烦乱或觉得惊恐', dimension: 'panic' },
      { id: 4, text: '我觉得我可能将要发疯', dimension: 'cognitive' },
      { id: 5, text: '我觉得一切都很好，也不会发生什么不幸', dimension: 'optimism', reverse: true },
      { id: 6, text: '我手脚发抖打颤', dimension: 'physical' },
      { id: 7, text: '我因为头痛、颈痛和背痛而苦恼', dimension: 'physical' },
      { id: 8, text: '我感觉容易衰弱和疲乏', dimension: 'energy' },
      { id: 9, text: '我觉得心平气和，并且容易安静坐着', dimension: 'calm', reverse: true },
      { id: 10, text: '我觉得心跳很快', dimension: 'physical' },
      { id: 11, text: '我因为一阵阵头晕而苦恼', dimension: 'physical' },
      { id: 12, text: '我有晕倒发作或觉得要晕倒似的', dimension: 'physical' },
      { id: 13, text: '我吸气呼气都感到很容易', dimension: 'breathing', reverse: true },
      { id: 14, text: '我的手脚麻木和刺痛', dimension: 'physical' },
      { id: 15, text: '我因为胃痛和消化不良而苦恼', dimension: 'physical' },
      { id: 16, text: '我常常要小便', dimension: 'physical' },
      { id: 17, text: '我的手脚常常是干燥温暖的', dimension: 'physical', reverse: true },
      { id: 18, text: '我脸红发热', dimension: 'physical' },
      { id: 19, text: '我容易入睡并且一夜睡得很好', dimension: 'sleep', reverse: true },
      { id: 20, text: '我作恶梦', dimension: 'sleep' }
    ]);
    
    const sasDimensions = JSON.stringify({
      anxiety: '焦虑情绪',
      fear: '恐惧感',
      panic: '惊恐感',
      cognitive: '认知障碍',
      optimism: '乐观感受',
      physical: '躯体症状',
      energy: '精力水平',
      calm: '平静感受',
      breathing: '呼吸状况',
      sleep: '睡眠质量'
    });
    
    const sasScoring = JSON.stringify({
      method: 'sas',
      optionValues: [1, 2, 3, 4],
      optionLabels: ['没有或很少时间', '少部分时间', '相当多时间', '绝大部分或全部时间']
    });
    
    const sasThresholds = JSON.stringify({
      normal: { min: 0, max: 49 },
      mild: { min: 50, max: 59 },
      moderate: { min: 60, max: 69 },
      severe: { min: 70, max: 100 }
    });
    
    db.prepare('INSERT INTO scales (name, description, questions, dimensions, scoring_rules, risk_thresholds, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(
        'SAS 焦虑自评量表',
        '焦虑自评量表（SAS）用于评定焦虑病人的主观感受，是了解焦虑症状的常用自评工具。适用于具有焦虑症状的成年人。',
        sasQuestions,
        sasDimensions,
        sasScoring,
        sasThresholds,
        2
      );

    const sdsQuestions = JSON.stringify([
      { id: 1, text: '我觉得闷闷不乐，情绪低沉', dimension: 'depression' },
      { id: 2, text: '我觉得一天之中早晨最好', dimension: 'diurnal', reverse: true },
      { id: 3, text: '我一阵阵哭出来或觉得想哭', dimension: 'depression' },
      { id: 4, text: '我晚上睡眠不好', dimension: 'sleep' },
      { id: 5, text: '我吃得跟平常一样多', dimension: 'appetite', reverse: true },
      { id: 6, text: '我与异性密切接触时和以往一样感到愉快', dimension: 'libido', reverse: true },
      { id: 7, text: '我发觉我的体重在下降', dimension: 'weight' },
      { id: 8, text: '我有便秘的苦恼', dimension: 'physical' },
      { id: 9, text: '我心跳比平时快', dimension: 'physical' },
      { id: 10, text: '我无缘无故地感到疲乏', dimension: 'energy' },
      { id: 11, text: '我的头脑跟平常一样清楚', dimension: 'cognitive', reverse: true },
      { id: 12, text: '我觉得经常做的事情并没有困难', dimension: 'activity', reverse: true },
      { id: 13, text: '我觉得不安而平静不下来', dimension: 'agitation' },
      { id: 14, text: '我对将来抱有希望', dimension: 'hope', reverse: true },
      { id: 15, text: '我比平常容易生气激动', dimension: 'irritability' },
      { id: 16, text: '我觉得作出决定是容易的', dimension: 'decision', reverse: true },
      { id: 17, text: '我觉得自己是个有用的人，有人需要我', dimension: 'worth', reverse: true },
      { id: 18, text: '我的生活过得很有意思', dimension: 'interest', reverse: true },
      { id: 19, text: '我认为如果我死了别人会生活得好些', dimension: 'suicide' },
      { id: 20, text: '平常感兴趣的事我仍然照样感兴趣', dimension: 'interest', reverse: true }
    ]);
    
    const sdsDimensions = JSON.stringify({
      depression: '抑郁情绪',
      diurnal: '昼夜变化',
      sleep: '睡眠障碍',
      appetite: '食欲变化',
      libido: '性兴趣',
      weight: '体重变化',
      physical: '躯体症状',
      energy: '精力水平',
      cognitive: '认知功能',
      activity: '活动能力',
      agitation: '精神运动性',
      hope: '希望感',
      irritability: '易激惹',
      decision: '决策能力',
      worth: '自我价值',
      interest: '兴趣丧失',
      suicide: '自杀意念'
    });
    
    const sdsScoring = JSON.stringify({
      method: 'sds',
      optionValues: [1, 2, 3, 4],
      optionLabels: ['没有或很少时间', '少部分时间', '相当多时间', '绝大部分或全部时间']
    });
    
    const sdsThresholds = JSON.stringify({
      normal: { min: 0, max: 52 },
      mild: { min: 53, max: 62 },
      moderate: { min: 63, max: 72 },
      severe: { min: 73, max: 100 }
    });
    
    db.prepare('INSERT INTO scales (name, description, questions, dimensions, scoring_rules, risk_thresholds, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(
        'SDS 抑郁自评量表',
        '抑郁自评量表（SDS）用于衡量抑郁状态的轻重程度及其在治疗中的变化，特别适用于发现抑郁症病人。',
        sdsQuestions,
        sdsDimensions,
        sdsScoring,
        sdsThresholds,
        2
      );

    const scl90Questions = JSON.stringify([
      { id: 1, text: '头痛', dimension: 'somatization' },
      { id: 2, text: '神经过敏，心中不踏实', dimension: 'anxiety' },
      { id: 3, text: '头脑中有不必要的想法或字句盘旋', dimension: 'obsessive' },
      { id: 4, text: '头昏或昏倒', dimension: 'somatization' },
      { id: 5, text: '对异性的兴趣减退', dimension: 'phobic' },
      { id: 6, text: '对旁人责备求全', dimension: 'interpersonal' },
      { id: 7, text: '感到别人能控制你的思想', dimension: 'psychoticism' },
      { id: 8, text: '责怪别人制造麻烦', dimension: 'hostility' },
      { id: 9, text: '忘性大', dimension: 'obsessive' },
      { id: 10, text: '担心自己的衣饰整齐及仪态的端正', dimension: 'obsessive' },
      { id: 11, text: '容易烦恼和激动', dimension: 'hostility' },
      { id: 12, text: '胸痛', dimension: 'somatization' },
      { id: 13, text: '害怕空旷的场所或街道', dimension: 'phobic' },
      { id: 14, text: '感到自己的精力下降，活动减慢', dimension: 'depression' },
      { id: 15, text: '想结束自己的生命', dimension: 'depression' },
      { id: 16, text: '听到旁人听不到的声音', dimension: 'psychoticism' },
      { id: 17, text: '发抖', dimension: 'anxiety' },
      { id: 18, text: '感到大多数人都不可信任', dimension: 'paranoid' },
      { id: 19, text: '胃口不好', dimension: 'somatization' },
      { id: 20, text: '容易哭泣', dimension: 'depression' },
      { id: 21, text: '同异性相处时感到害羞不自在', dimension: 'phobic' },
      { id: 22, text: '感到受骗、中了圈套或有人想抓住你', dimension: 'paranoid' },
      { id: 23, text: '无缘无故地突然感到害怕', dimension: 'phobic' },
      { id: 24, text: '自己不能控制地大发脾气', dimension: 'hostility' },
      { id: 25, text: '怕单独出门', dimension: 'phobic' },
      { id: 26, text: '经常责怪自己', dimension: 'depression' },
      { id: 27, text: '腰痛', dimension: 'somatization' },
      { id: 28, text: '感到难以完成任务', dimension: 'obsessive' },
      { id: 29, text: '感到孤独', dimension: 'interpersonal' },
      { id: 30, text: '感到苦闷', dimension: 'depression' },
      { id: 31, text: '过分担忧', dimension: 'anxiety' },
      { id: 32, text: '对事物不感兴趣', dimension: 'depression' },
      { id: 33, text: '感到害怕', dimension: 'anxiety' },
      { id: 34, text: '你的感情容易受到伤害', dimension: 'interpersonal' },
      { id: 35, text: '旁人能知道你的私下想法', dimension: 'psychoticism' },
      { id: 36, text: '感到别人不理解你、不同情你', dimension: 'interpersonal' },
      { id: 37, text: '感到人们对你不友好、不喜欢你', dimension: 'paranoid' },
      { id: 38, text: '做事必须做得很慢以保证做得正确', dimension: 'obsessive' },
      { id: 39, text: '心跳得很厉害', dimension: 'anxiety' },
      { id: 40, text: '恶心或胃部不舒服', dimension: 'somatization' },
      { id: 41, text: '感到比不上他人', dimension: 'interpersonal' },
      { id: 42, text: '肌肉酸痛', dimension: 'somatization' },
      { id: 43, text: '感到有人在监视你、谈论你', dimension: 'paranoid' },
      { id: 44, text: '难以入睡', dimension: 'somatization' },
      { id: 45, text: '做事必须反复检查', dimension: 'obsessive' },
      { id: 46, text: '难以作出决定', dimension: 'obsessive' },
      { id: 47, text: '怕乘电车、公共汽车、地铁或火车', dimension: 'phobic' },
      { id: 48, text: '呼吸有困难', dimension: 'anxiety' },
      { id: 49, text: '一阵阵发冷或发热', dimension: 'somatization' },
      { id: 50, text: '因为感到害怕而避开某些东西、场合或活动', dimension: 'phobic' },
      { id: 51, text: '脑子变空了', dimension: 'obsessive' },
      { id: 52, text: '身体发麻或刺痛', dimension: 'somatization' },
      { id: 53, text: '喉咙有梗塞感', dimension: 'somatization' },
      { id: 54, text: '感到前途没有希望', dimension: 'depression' },
      { id: 55, text: '不能集中注意', dimension: 'obsessive' },
      { id: 56, text: '感到身体的某一部分软弱无力', dimension: 'somatization' },
      { id: 57, text: '感到紧张或容易紧张', dimension: 'anxiety' },
      { id: 58, text: '感到手或脚发重', dimension: 'somatization' },
      { id: 59, text: '想到死亡的事', dimension: 'depression' },
      { id: 60, text: '吃得太多', dimension: 'somatization' },
      { id: 61, text: '当别人看着你或谈论你时感到不自在', dimension: 'interpersonal' },
      { id: 62, text: '有一些不属于你自己的想法', dimension: 'psychoticism' },
      { id: 63, text: '有想打人或伤害他人的冲动', dimension: 'hostility' },
      { id: 64, text: '醒得太早', dimension: 'somatization' },
      { id: 65, text: '必须反复洗手、点数目或触摸某些东西', dimension: 'obsessive' },
      { id: 66, text: '睡得不稳不深', dimension: 'somatization' },
      { id: 67, text: '有想摔坏或破坏东西的冲动', dimension: 'hostility' },
      { id: 68, text: '有一些别人没有的想法或念头', dimension: 'psychoticism' },
      { id: 69, text: '感到对别人神经过敏', dimension: 'paranoid' },
      { id: 70, text: '在商店或电影院等人多的地方感到不自在', dimension: 'phobic' },
      { id: 71, text: '感到任何事情都很困难', dimension: 'depression' },
      { id: 72, text: '一阵阵恐惧或惊恐', dimension: 'anxiety' },
      { id: 73, text: '感到在公共场合吃东西很不舒服', dimension: 'phobic' },
      { id: 74, text: '经常与人争论', dimension: 'hostility' },
      { id: 75, text: '单独一人时神经很紧张', dimension: 'anxiety' },
      { id: 76, text: '别人对你的成绩没有作出恰当的评价', dimension: 'paranoid' },
      { id: 77, text: '即使和别人在一起也感到孤单', dimension: 'interpersonal' },
      { id: 78, text: '感到坐立不安心神不定', dimension: 'anxiety' },
      { id: 79, text: '感到自己没有什么价值', dimension: 'depression' },
      { id: 80, text: '感到熟悉的东西变成陌生或不像是真的', dimension: 'psychoticism' },
      { id: 81, text: '大叫或摔东西', dimension: 'hostility' },
      { id: 82, text: '害怕会在公共场合昏倒', dimension: 'phobic' },
      { id: 83, text: '感到别人想占你的便宜', dimension: 'paranoid' },
      { id: 84, text: '为一些有关"性"的想法而很苦恼', dimension: 'psychoticism' },
      { id: 85, text: '你认为应该因为自己的过错而受到惩罚', dimension: 'depression' },
      { id: 86, text: '感到要赶快把事情做完', dimension: 'anxiety' },
      { id: 87, text: '感到自己的身体有严重问题', dimension: 'somatization' },
      { id: 88, text: '从未感到和其他人很亲近', dimension: 'interpersonal' },
      { id: 89, text: '感到自己有罪', dimension: 'depression' },
      { id: 90, text: '感到自己的脑子有毛病', dimension: 'psychoticism' }
    ]);
    
    const scl90Dimensions = JSON.stringify({
      somatization: '躯体化',
      obsessive: '强迫症状',
      interpersonal: '人际关系敏感',
      depression: '抑郁',
      anxiety: '焦虑',
      hostility: '敌对',
      phobic: '恐怖',
      paranoid: '偏执',
      psychoticism: '精神病性',
      other: '其他'
    });
    
    const scl90Scoring = JSON.stringify({
      method: 'scl90',
      optionValues: [0, 1, 2, 3, 4],
      optionLabels: ['没有', '很轻', '中等', '偏重', '严重']
    });
    
    const scl90Thresholds = JSON.stringify({
      normal: { min: 0, max: 159 },
      mild: { min: 160, max: 200 },
      moderate: { min: 201, max: 299 },
      severe: { min: 300, max: 360 }
    });
    
    db.prepare('INSERT INTO scales (name, description, questions, dimensions, scoring_rules, risk_thresholds, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(
        'SCL-90 症状自评量表',
        '症状自评量表（SCL-90）是世界上最著名的心理健康测试量表之一，共90个项目，包含10个因子，全面评估心理健康状况。',
        scl90Questions,
        scl90Dimensions,
        scl90Scoring,
        scl90Thresholds,
        2
      );
  }

  const planCheck = db.prepare('SELECT COUNT(*) as count FROM assessment_plans');
  if (planCheck.get().count === 0) {
    const consentText = '知情同意书：\n\n您好！\n本次心理测评旨在了解您的心理健康状况，帮助您更好地认识自己。\n\n重要说明：\n1. 测评结果仅供参考，不作为诊断依据\n2. 您的回答将严格保密\n3. 您可以随时停止测评\n4. 如果您感到困扰，可以联系学校心理中心\n\n请点击"同意"继续测评。';
    
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    db.prepare('INSERT INTO assessment_plans (name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        '2024年春季学期心理健康普查（七年级）',
        1,
        JSON.stringify([7]),
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        0,
        consentText,
        2,
        'active'
      );
    
    db.prepare('INSERT INTO assessment_plans (name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        '2024年春季学期心理健康普查（八年级）',
        2,
        JSON.stringify([8]),
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        1,
        consentText,
        2,
        'active'
      );
    
    db.prepare('INSERT INTO assessment_plans (name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        '焦虑情绪专项测评',
        3,
        JSON.stringify([7, 8, 9]),
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        0,
        consentText,
        2,
        'active'
      );
    
    db.prepare('INSERT INTO assessment_plans (name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        '抑郁情绪专项测评',
        4,
        JSON.stringify([7, 8, 9]),
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        0,
        consentText,
        2,
        'active'
      );
    
    db.prepare('INSERT INTO assessment_plans (name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        '综合心理健康评估（SCL-90）',
        5,
        JSON.stringify([9, 10, 11, 12]),
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        1,
        consentText,
        2,
        'active'
      );
  }

  const resultCheck = db.prepare('SELECT COUNT(*) as count FROM assessment_results');
  if (resultCheck.get().count === 0) {
    const sampleAnswers1 = JSON.stringify({ 1: 2, 2: 2, 3: 1, 4: 2, 5: 1, 6: 2, 7: 1, 8: 1, 9: 0 });
    const dimensionScores1 = JSON.stringify({
      depression: { score: 4, count: 2, maxScore: 6, avgScore: 2, label: '抑郁情绪' },
      sleep: { score: 1, count: 1, maxScore: 3, avgScore: 1, label: '睡眠问题' },
      energy: { score: 2, count: 1, maxScore: 3, avgScore: 2, label: '精力水平' },
      appetite: { score: 1, count: 1, maxScore: 3, avgScore: 1, label: '食欲问题' },
      self_esteem: { score: 2, count: 1, maxScore: 3, avgScore: 2, label: '自我评价' },
      concentration: { score: 1, count: 1, maxScore: 3, avgScore: 1, label: '注意力' },
      psychomotor: { score: 1, count: 1, maxScore: 3, avgScore: 1, label: '精神运动' },
      suicide: { score: 0, count: 1, maxScore: 3, avgScore: 0, label: '自伤倾向' }
    });
    
    db.prepare('INSERT INTO consent_logs (plan_id, student_id, anonymous_id, consented, consented_at) VALUES (?, ?, ?, ?, ?)')
      .run(1, 4, null, 1, new Date().toISOString());
    
    db.prepare('INSERT INTO assessment_records (plan_id, student_id, anonymous_id, answers, progress, status, start_time, submit_time, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(1, 4, null, sampleAnswers1, 100, 'submitted', new Date(Date.now() - 3600000).toISOString(), new Date().toISOString(), 320);
    
    db.prepare('INSERT INTO assessment_results (record_id, total_score, dimension_scores, risk_level, risk_factors) VALUES (?, ?, ?, ?, ?)')
      .run(1, 12, dimensionScores1, 'moderate', JSON.stringify({ unanswered: [], durationSeconds: 320 }));
    
    db.prepare(`
      INSERT INTO todos (type, related_id, assignee_id, title, description, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'intervention',
      1,
      2,
      '中度风险学生需要干预',
      '学生王小明测评结果为中度风险，请及时跟进干预。',
      'high',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      'pending'
    );

    db.prepare('INSERT INTO consent_logs (plan_id, student_id, anonymous_id, consented, consented_at) VALUES (?, ?, ?, ?, ?)')
      .run(1, 5, null, 1, new Date().toISOString());
    
    db.prepare('INSERT INTO assessment_records (plan_id, student_id, anonymous_id, answers, progress, status, start_time, submit_time, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(1, 5, null, JSON.stringify({}), 0, 'incomplete', new Date().toISOString(), null, 0);

    const sampleAnswers3 = JSON.stringify({ 1: 3, 2: 3, 3: 2, 4: 3, 5: 2, 6: 3, 7: 2, 8: 2, 9: 1 });
    const dimensionScores3 = JSON.stringify({
      depression: { score: 6, count: 2, maxScore: 6, avgScore: 3, label: '抑郁情绪' },
      sleep: { score: 2, count: 1, maxScore: 3, avgScore: 2, label: '睡眠问题' },
      energy: { score: 3, count: 1, maxScore: 3, avgScore: 3, label: '精力水平' },
      appetite: { score: 2, count: 1, maxScore: 3, avgScore: 2, label: '食欲问题' },
      self_esteem: { score: 3, count: 1, maxScore: 3, avgScore: 3, label: '自我评价' },
      concentration: { score: 2, count: 1, maxScore: 3, avgScore: 2, label: '注意力' },
      psychomotor: { score: 2, count: 1, maxScore: 3, avgScore: 2, label: '精神运动' },
      suicide: { score: 1, count: 1, maxScore: 3, avgScore: 1, label: '自伤倾向' }
    });
    
    db.prepare('INSERT INTO consent_logs (plan_id, student_id, anonymous_id, consented, consented_at) VALUES (?, ?, ?, ?, ?)')
      .run(1, 6, null, 1, new Date().toISOString());
    
    db.prepare('INSERT INTO assessment_records (plan_id, student_id, anonymous_id, answers, progress, status, start_time, submit_time, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(1, 6, null, sampleAnswers3, 100, 'submitted', new Date(Date.now() - 1800000).toISOString(), new Date(Date.now() - 900000).toISOString(), 45);
    
    db.prepare('INSERT INTO assessment_results (record_id, total_score, dimension_scores, risk_level, risk_factors) VALUES (?, ?, ?, ?, ?)')
      .run(3, 21, dimensionScores3, 'severe', JSON.stringify({ unanswered: [], durationSeconds: 45 }));
    
    db.prepare(`
      INSERT INTO todos (type, related_id, assignee_id, title, description, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'intervention',
      3,
      2,
      '严重风险学生紧急干预',
      '学生张小强测评结果为严重风险，答题时间异常，需立即跟进。',
      'urgent',
      new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      'pending'
    );

    db.prepare(`
      INSERT INTO interventions (student_id, result_id, type, content, outcome, created_by, is_closed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      4,
      1,
      'interview',
      '与学生进行了初步访谈，了解其近期情绪状态。学生表示最近睡眠不好，学习压力较大。',
      '学生愿意继续沟通，约定下周继续访谈。',
      2,
      0
    );
  }
};

module.exports = { db, initDatabase };
