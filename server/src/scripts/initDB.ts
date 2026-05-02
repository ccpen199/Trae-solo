import bcrypt from 'bcryptjs';
import { connectDB, sequelize } from '../database/sequelize';
import { User, UserRole } from '../models/User';
import { KnowledgePoint } from '../models/KnowledgePoint';
import { Question, QuestionType, DifficultyLevel } from '../models/Question';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const createDefaultUsers = async (): Promise<void> => {
  const users = [
    {
      username: 'admin',
      password: await hashPassword('Admin@123'),
      name: '系统管理员',
      role: UserRole.ADMIN,
      email: 'admin@exam.com',
      phone: '13800000001',
      department: '系统管理部',
    },
    {
      username: 'setter01',
      password: await hashPassword('Setter@123'),
      name: '张老师',
      role: UserRole.QUESTION_SETTER,
      email: 'zhang@exam.com',
      phone: '13800000002',
      department: '教学部',
    },
    {
      username: 'setter02',
      password: await hashPassword('Setter@123'),
      name: '李老师',
      role: UserRole.QUESTION_SETTER,
      email: 'li@exam.com',
      phone: '13800000003',
      department: '教学部',
    },
    {
      username: 'grader01',
      password: await hashPassword('Grader@123'),
      name: '王阅卷',
      role: UserRole.GRADER,
      email: 'wang@exam.com',
      phone: '13800000004',
      department: '阅卷组',
    },
    {
      username: 'student01',
      password: await hashPassword('Student@123'),
      name: '小明',
      role: UserRole.EXAMINEE,
      email: 'xiaoming@exam.com',
      phone: '13900000001',
      department: '一班',
    },
    {
      username: 'student02',
      password: await hashPassword('Student@123'),
      name: '小红',
      role: UserRole.EXAMINEE,
      email: 'xiaohong@exam.com',
      phone: '13900000002',
      department: '一班',
    },
    {
      username: 'student03',
      password: await hashPassword('Student@123'),
      name: '小刚',
      role: UserRole.EXAMINEE,
      email: 'xiaogang@exam.com',
      phone: '13900000003',
      department: '一班',
    },
    {
      username: 'student04',
      password: await hashPassword('Student@123'),
      name: '小丽',
      role: UserRole.EXAMINEE,
      email: 'xiaoli@exam.com',
      phone: '13900000004',
      department: '二班',
    },
  ];

  for (const user of users) {
    await User.findOrCreate({
      where: { username: user.username },
      defaults: user,
    });
  }

  console.log('默认用户创建完成');
};

const createKnowledgePoints = async (): Promise<void> => {
  const knowledgePoints = [
    { id: 'kp-001', name: '计算机基础', code: 'CS-BASICS', sortOrder: 1, isActive: true },
    { id: 'kp-002', name: '数据结构', code: 'DS', parentId: 'kp-001', sortOrder: 1, isActive: true },
    { id: 'kp-003', name: '算法', code: 'ALG', parentId: 'kp-001', sortOrder: 2, isActive: true },
    { id: 'kp-004', name: '数据库', code: 'DB', parentId: 'kp-001', sortOrder: 3, isActive: true },
    { id: 'kp-005', name: '网络', code: 'NET', parentId: 'kp-001', sortOrder: 4, isActive: true },
    { id: 'kp-006', name: '数组', code: 'DS-ARRAY', parentId: 'kp-002', sortOrder: 1, isActive: true },
    { id: 'kp-007', name: '链表', code: 'DS-LIST', parentId: 'kp-002', sortOrder: 2, isActive: true },
    { id: 'kp-008', name: '栈与队列', code: 'DS-STACK', parentId: 'kp-002', sortOrder: 3, isActive: true },
    { id: 'kp-009', name: '树', code: 'DS-TREE', parentId: 'kp-002', sortOrder: 4, isActive: true },
    { id: 'kp-010', name: '排序算法', code: 'ALG-SORT', parentId: 'kp-003', sortOrder: 1, isActive: true },
    { id: 'kp-011', name: '查找算法', code: 'ALG-SEARCH', parentId: 'kp-003', sortOrder: 2, isActive: true },
    { id: 'kp-012', name: 'SQL', code: 'DB-SQL', parentId: 'kp-004', sortOrder: 1, isActive: true },
    { id: 'kp-013', name: 'TCP/IP', code: 'NET-TCP', parentId: 'kp-005', sortOrder: 1, isActive: true },
  ];

  for (const kp of knowledgePoints) {
    await KnowledgePoint.findOrCreate({
      where: { code: kp.code },
      defaults: kp,
    });
  }

  console.log('知识点创建完成');
};

const createQuestions = async (): Promise<void> => {
  const setterUser = await User.findOne({ where: { username: 'setter01' } });
  if (!setterUser) {
    console.error('未找到出题人用户');
    return;
  }

  const questions = [
    {
      title: '以下哪个是线性数据结构？',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      score: 2,
      content: '以下哪个是线性数据结构？',
      explanation: '线性数据结构是数据元素之间存在一对一关系的数据结构。数组、链表、栈、队列都是线性结构。',
      options: [
        { id: 'opt-1', label: 'A', content: '树', isCorrect: false },
        { id: 'opt-2', label: 'B', content: '图', isCorrect: false },
        { id: 'opt-3', label: 'C', content: '数组', isCorrect: true },
        { id: 'opt-4', label: 'D', content: '堆', isCorrect: false },
      ],
      knowledgePointId: 'kp-006',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: '以下哪些是常见的排序算法？',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      score: 3,
      content: '以下哪些是常见的排序算法？（多选）',
      explanation: '冒泡排序、快速排序、归并排序都是常见的排序算法。哈希是一种查找技术，不是排序算法。',
      options: [
        { id: 'opt-1', label: 'A', content: '冒泡排序', isCorrect: true },
        { id: 'opt-2', label: 'B', content: '快速排序', isCorrect: true },
        { id: 'opt-3', label: 'C', content: '哈希', isCorrect: false },
        { id: 'opt-4', label: 'D', content: '归并排序', isCorrect: true },
      ],
      knowledgePointId: 'kp-010',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: '栈是一种先进先出（FIFO）的数据结构。',
      type: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      score: 1,
      content: '栈是一种先进先出（FIFO）的数据结构。',
      explanation: '栈是一种后进先出（LIFO）的数据结构，队列才是先进先出（FIFO）的数据结构。',
      correctAnswer: 'false',
      knowledgePointId: 'kp-008',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: '请简述快速排序的基本思想和时间复杂度。',
      type: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      score: 5,
      content: '请简述快速排序的基本思想和时间复杂度。',
      explanation: '快速排序采用分治策略：选择一个基准元素，将数组分成两部分，一部分都比基准小，另一部分都比基准大，然后递归排序这两部分。平均时间复杂度O(nlogn)，最坏情况O(n²)，空间复杂度O(logn)。',
      knowledgePointId: 'kp-010',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: '请设计一个算法，在O(n)时间复杂度内查找数组中第k大的元素。',
      type: QuestionType.ESSAY,
      difficulty: DifficultyLevel.HARD,
      score: 10,
      content: '请设计一个算法，在O(n)时间复杂度内查找数组中第k大的元素。要求：\n1. 描述算法思想\n2. 写出伪代码\n3. 分析时间复杂度',
      explanation: '使用快速选择算法，基于快速排序的分区思想，每次选择一个基准元素，将数组分为两部分，根据基准元素的位置决定继续在哪一部分查找，平均时间复杂度O(n)。',
      knowledgePointId: 'kp-011',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: '以下SQL语句中，哪个用于删除表中的数据但保留表结构？',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      score: 2,
      content: '以下SQL语句中，哪个用于删除表中的数据但保留表结构？',
      explanation: 'DELETE语句用于删除表中的数据行，表结构保留；DROP TABLE用于删除整个表；TRUNCATE TABLE也会删除数据但不记录日志。',
      options: [
        { id: 'opt-1', label: 'A', content: 'DROP TABLE', isCorrect: false },
        { id: 'opt-2', label: 'B', content: 'DELETE', isCorrect: true },
        { id: 'opt-3', label: 'C', content: 'REMOVE', isCorrect: false },
        { id: 'opt-4', label: 'D', content: 'DELETE TABLE', isCorrect: false },
      ],
      knowledgePointId: 'kp-012',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: 'TCP协议是一种可靠的传输层协议。',
      type: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      score: 1,
      content: 'TCP协议是一种可靠的传输层协议，提供面向连接、可靠的字节流服务。',
      explanation: 'TCP（传输控制协议）是一种面向连接的、可靠的传输层协议，通过确认机制、重传机制、流量控制等保证数据的可靠传输。UDP是不可靠的传输协议。',
      correctAnswer: 'true',
      knowledgePointId: 'kp-013',
      creatorId: setterUser.id,
      isShared: true,
    },
    {
      title: '二叉树的遍历方式有哪些？请分别说明。',
      type: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      score: 5,
      content: '二叉树的遍历方式有哪些？请分别说明每种遍历方式的访问顺序。',
      explanation: '二叉树的遍历方式包括：\n1. 前序遍历（根-左-右）：先访问根节点，再遍历左子树，最后遍历右子树\n2. 中序遍历（左-根-右）：先遍历左子树，再访问根节点，最后遍历右子树\n3. 后序遍历（左-右-根）：先遍历左子树，再遍历右子树，最后访问根节点\n4. 层序遍历：按层次从上到下、从左到右访问节点',
      knowledgePointId: 'kp-009',
      creatorId: setterUser.id,
      isShared: true,
    },
  ];

  for (const question of questions) {
    await Question.findOrCreate({
      where: { title: question.title, creatorId: question.creatorId },
      defaults: question,
    });
  }

  console.log('示例题目创建完成');
};

const initDB = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('开始初始化数据库...');

    await sequelize.sync({ force: true });
    console.log('数据库表同步完成');

    await createDefaultUsers();
    await createKnowledgePoints();
    await createQuestions();

    console.log('数据库初始化完成！');
    console.log('');
    console.log('默认账号信息：');
    console.log('');
    console.log('管理员：');
    console.log('  用户名: admin');
    console.log('  密码: Admin@123');
    console.log('');
    console.log('出题人：');
    console.log('  用户名: setter01 / setter02');
    console.log('  密码: Setter@123');
    console.log('');
    console.log('阅卷老师：');
    console.log('  用户名: grader01');
    console.log('  密码: Grader@123');
    console.log('');
    console.log('考生：');
    console.log('  用户名: student01 / student02 / student03 / student04');
    console.log('  密码: Student@123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

initDB();
