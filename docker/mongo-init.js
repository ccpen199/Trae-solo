db = db.getSiblingDB('qa_community');

db.createCollection('users');
db.createCollection('questions');
db.createCollection('answers');
db.createCollection('votes');
db.createCollection('transactions');
db.createCollection('knowledgenodes');
db.createCollection('creditrecords');
db.createCollection('archiverecords');
db.createCollection('notifications');

db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'role': 1, 'status': 1 });
db.users.createIndex({ 'creditScore': -1 });
db.users.createIndex({ 'profile.expertise': 1 });

db.questions.createIndex({ 'questionId': 1 }, { unique: true });
db.questions.createIndex({ 'author': 1, 'createdAt': -1 });
db.questions.createIndex({ 'status': 1, 'workflowStatus': 1 });
db.questions.createIndex({ 'tags': 1 });
db.questions.createIndex({ 'createdAt': -1 });

db.answers.createIndex({ 'answerId': 1 }, { unique: true });
db.answers.createIndex({ 'question': 1, 'createdAt': 1 });
db.answers.createIndex({ 'author': 1, 'createdAt': -1 });
db.answers.createIndex({ 'isAccepted': 1 });
db.answers.createIndex({ 'rankScore': -1 });

db.votes.createIndex({ 'voter': 1, 'targetType': 1, 'targetId': 1 }, { unique: true });
db.votes.createIndex({ 'targetType': 1, 'targetId': 1, 'createdAt': -1 });

db.transactions.createIndex({ 'transactionId': 1 }, { unique: true });
db.transactions.createIndex({ 'fromUser': 1, 'createdAt': -1 });
db.transactions.createIndex({ 'toUser': 1, 'createdAt': -1 });
db.transactions.createIndex({ 'status': 1, 'createdAt': -1 });

db.knowledgenodes.createIndex({ 'nodeId': 1 }, { unique: true });
db.knowledgenodes.createIndex({ 'permanentLink': 1 }, { unique: true });
db.knowledgenodes.createIndex({ 'nodeType': 1, 'domain': 1 });
db.knowledgenodes.createIndex({ 'tags': 1 });
db.knowledgenodes.createIndex({ 'statistics.qualityScore': -1 });

db.creditrecords.createIndex({ 'recordId': 1 }, { unique: true });
db.creditrecords.createIndex({ 'user': 1, 'createdAt': -1 });

db.archiverecords.createIndex({ 'archiveId': 1 }, { unique: true });
db.archiverecords.createIndex({ 'archiveType': 1, 'createdAt': -1 });
db.archiverecords.createIndex({ 'sourceCollection': 1, 'sourceDocumentId': 1 });

db.notifications.createIndex({ 'notificationId': 1 }, { unique: true });
db.notifications.createIndex({ 'recipient': 1, 'createdAt': -1 });
db.notifications.createIndex({ 'recipient': 1, 'isRead': 1, 'createdAt': -1 });

const crypto = require('crypto');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `$2b$10$${salt}${hash}`;
};

const defaultUsers = [
  {
    username: 'admin',
    email: 'admin@qa-community.com',
    password: 'Admin123!',
    role: 'admin',
    profile: {
      nickname: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      bio: 'QA Community 系统管理员',
      expertise: ['系统管理', '平台运维']
    },
    creditScore: 1000,
    creditLevel: 'diamond',
    balance: 10000,
    points: 10000,
    status: 'active',
    isVerified: true
  },
  {
    username: 'editor',
    email: 'editor@qa-community.com',
    password: 'Editor123!',
    role: 'editor',
    profile: {
      nickname: '知识编辑',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
      bio: '负责知识库内容审核和收录',
      expertise: ['内容审核', '知识图谱', '质量管理']
    },
    creditScore: 750,
    creditLevel: 'platinum',
    balance: 5000,
    points: 5000,
    status: 'active',
    isVerified: true
  },
  {
    username: 'expert_js',
    email: 'expert_js@qa-community.com',
    password: 'Expert123!',
    role: 'expert',
    profile: {
      nickname: 'JavaScript大师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert_js',
      bio: '10年前端开发经验，专注于JavaScript生态系统',
      expertise: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', '前端架构']
    },
    creditScore: 680,
    creditLevel: 'platinum',
    balance: 3500,
    points: 8500,
    status: 'active',
    isVerified: true
  },
  {
    username: 'expert_python',
    email: 'expert_python@qa-community.com',
    password: 'Expert123!',
    role: 'expert',
    profile: {
      nickname: 'Python专家',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert_python',
      bio: '8年Python开发经验，数据科学家',
      expertise: ['Python', '数据分析', '机器学习', 'Django', 'Flask', '数据科学']
    },
    creditScore: 620,
    creditLevel: 'gold',
    balance: 2800,
    points: 7200,
    status: 'active',
    isVerified: true
  },
  {
    username: 'answerer_1',
    email: 'answerer1@qa-community.com',
    password: 'Answer123!',
    role: 'answerer',
    profile: {
      nickname: '全栈开发者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=answerer1',
      bio: '热爱技术，乐于分享',
      expertise: ['Java', 'Spring', 'MySQL', 'Redis', '微服务']
    },
    creditScore: 350,
    creditLevel: 'silver',
    balance: 1200,
    points: 3500,
    status: 'active',
    isVerified: true
  },
  {
    username: 'questioner_1',
    email: 'questioner1@qa-community.com',
    password: 'Question123!',
    role: 'questioner',
    profile: {
      nickname: '学习中的菜鸟',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=questioner1',
      bio: '前端入门学习者',
      expertise: ['前端入门', 'HTML', 'CSS']
    },
    creditScore: 120,
    creditLevel: 'bronze',
    balance: 500,
    points: 1000,
    status: 'active',
    isVerified: true
  }
];

const bcrypt = require('bcryptjs');

defaultUsers.forEach(user => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  
  db.users.insertOne({
    ...user,
    password: hashedPassword,
    metadata: {
      questionCount: 0,
      answerCount: 0,
      acceptedAnswerCount: 0,
      voteReceived: 0,
      voteGiven: 0
    },
    notificationPreferences: {
      email: true,
      push: true,
      expertMatch: true
    },
    activityWeight: 1.0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

print('Default users created successfully!');
print('Login credentials:');
print('- admin / Admin123!');
print('- editor / Editor123!');
print('- expert_js / Expert123!');
print('- expert_python / Expert123!');
print('- answerer_1 / Answer123!');
print('- questioner_1 / Question123!');
