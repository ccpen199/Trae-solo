const crypto = require('crypto');

class MemoryStore {
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.orders = new Map();
    this.assignments = new Map();
    this.assignmentSubmissions = new Map();
    this.questions = new Map();
    this.certificates = new Map();
    this.enrollments = new Map();
    this.learningProgresses = new Map();
    
    this._initMockData();
  }

  _initMockData() {
    const now = new Date().toISOString();

    const adminId = this._generateId();
    const teacherId = this._generateId();
    const taId = this._generateId();
    const studentId = this._generateId();

    this.users.set(adminId, {
      _id: adminId,
      username: '系统管理员',
      email: 'admin@learning.com',
      password: this._hashPassword('admin123456'),
      role: 'admin',
      avatar: '',
      bio: '在线教育平台系统管理员',
      phone: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    this.users.set(teacherId, {
      _id: teacherId,
      username: '张教授',
      email: 'teacher@learning.com',
      password: this._hashPassword('teacher123456'),
      role: 'teacher',
      avatar: '',
      bio: '计算机科学与技术学院教授，拥有15年教学经验。专注于Web开发、人工智能和数据科学领域。',
      phone: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    this.users.set(taId, {
      _id: taId,
      username: '李助教',
      email: 'ta@learning.com',
      password: this._hashPassword('ta123456'),
      role: 'ta',
      avatar: '',
      bio: '计算机科学专业研究生，热爱编程和教学。负责课程作业批改和答疑。',
      phone: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    this.users.set(studentId, {
      _id: studentId,
      username: '王学员',
      email: 'student@learning.com',
      password: this._hashPassword('student123456'),
      role: 'student',
      avatar: '',
      bio: '热爱学习的程序员，正在提升自己的技术能力。',
      phone: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    const course1Id = this._generateId();
    const course2Id = this._generateId();
    const course3Id = this._generateId();

    this.courses.set(course1Id, {
      _id: course1Id,
      title: 'JavaScript 从入门到精通',
      description: '本课程将带你从零开始学习 JavaScript，涵盖基础语法、函数、对象、异步编程等核心概念。通过大量实战项目，帮助你掌握现代 Web 开发技能。',
      coverImage: '',
      category: '前端开发',
      tags: ['JavaScript', '前端', 'Web开发'],
      price: 299,
      originalPrice: 599,
      teacher: teacherId,
      teacherInfo: { username: '张教授', avatar: '' },
      status: 'published',
      difficulty: 'beginner',
      estimatedDuration: 36000,
      chapters: [
        {
          _id: this._generateId(),
          title: '第一章：JavaScript 基础',
          description: '学习 JavaScript 的基本语法和数据类型',
          sortOrder: 1,
          lessons: [
            {
              _id: this._generateId(),
              title: '1.1 什么是 JavaScript',
              description: '了解 JavaScript 的历史和用途',
              videoUrl: '',
              duration: 900,
              freePreview: true,
              sortOrder: 1
            },
            {
              _id: this._generateId(),
              title: '1.2 变量和数据类型',
              description: '学习 var、let、const 和基本数据类型',
              videoUrl: '',
              duration: 1200,
              freePreview: true,
              sortOrder: 2
            }
          ]
        }
      ],
      stats: {
        totalStudents: 128,
        totalLessons: 24,
        rating: 4.8,
        ratingCount: 56
      },
      createdAt: now,
      updatedAt: now
    });

    this.courses.set(course2Id, {
      _id: course2Id,
      title: 'React 实战开发',
      description: '本课程将带你深入学习 React 框架，从基础到高级，涵盖组件开发、状态管理、路由、性能优化等核心内容。',
      coverImage: '',
      category: '前端开发',
      tags: ['React', '前端', '组件化'],
      price: 399,
      originalPrice: 699,
      teacher: teacherId,
      teacherInfo: { username: '张教授', avatar: '' },
      status: 'published',
      difficulty: 'intermediate',
      estimatedDuration: 45000,
      chapters: [
        {
          _id: this._generateId(),
          title: '第一章：React 入门',
          description: '了解 React 的核心概念和开发环境',
          sortOrder: 1,
          lessons: [
            {
              _id: this._generateId(),
              title: '1.1 React 简介',
              description: '了解 React 的由来和优势',
              videoUrl: '',
              duration: 800,
              freePreview: true,
              sortOrder: 1
            }
          ]
        }
      ],
      stats: {
        totalStudents: 86,
        totalLessons: 18,
        rating: 4.9,
        ratingCount: 42
      },
      createdAt: now,
      updatedAt: now
    });

    this.courses.set(course3Id, {
      _id: course3Id,
      title: 'Python 数据分析实战',
      description: '从零开始学习 Python 数据分析，掌握 NumPy、Pandas、Matplotlib 等核心库，通过实际项目提升数据分析能力。',
      coverImage: '',
      category: '数据科学',
      tags: ['Python', '数据分析', 'Pandas'],
      price: 349,
      originalPrice: 599,
      teacher: teacherId,
      teacherInfo: { username: '张教授', avatar: '' },
      status: 'published',
      difficulty: 'intermediate',
      estimatedDuration: 40000,
      chapters: [],
      stats: {
        totalStudents: 64,
        totalLessons: 16,
        rating: 4.7,
        ratingCount: 28
      },
      createdAt: now,
      updatedAt: now
    });

    const assignment1Id = this._generateId();
    this.assignments.set(assignment1Id, {
      _id: assignment1Id,
      title: '第一章课后作业',
      description: '完成 JavaScript 基础语法练习，包括变量声明、数据类型转换、运算符使用等。',
      course: course1Id,
      courseInfo: { title: 'JavaScript 从入门到精通' },
      teacher: teacherId,
      teacherInfo: { username: '张教授' },
      type: 'homework',
      status: 'published',
      passingScore: 60,
      totalScore: 100,
      startDate: now,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      attempts: 3,
      timeLimit: null,
      questions: [
        {
          _id: this._generateId(),
          type: 'single_choice',
          content: '以下哪个不是 JavaScript 的基本数据类型？',
          options: ['String', 'Number', 'Array', 'Boolean'],
          correctAnswer: 'Array',
          score: 10,
          explanation: 'Array 是引用数据类型，不是基本数据类型。'
        },
        {
          _id: this._generateId(),
          type: 'true_false',
          content: 'JavaScript 是一种强类型语言。',
          options: ['正确', '错误'],
          correctAnswer: '错误',
          score: 5,
          explanation: 'JavaScript 是弱类型（动态类型）语言。'
        },
        {
          _id: this._generateId(),
          type: 'essay',
          content: '请简述 JavaScript 中 == 和 === 的区别，并举例说明。',
          correctAnswer: null,
          score: 60,
          explanation: '== 是抽象相等，会进行类型转换；=== 是严格相等，不会进行类型转换。'
        }
      ],
      stats: {
        submittedCount: 5,
        gradedCount: 3,
        avgScore: 78
      },
      createdAt: now,
      updatedAt: now
    });

    const assignment2Id = this._generateId();
    this.assignments.set(assignment2Id, {
      _id: assignment2Id,
      title: '第一章单元测验',
      description: '测验你对 React 基础概念的掌握程度。',
      course: course2Id,
      courseInfo: { title: 'React 实战开发' },
      teacher: teacherId,
      teacherInfo: { username: '张教授' },
      type: 'quiz',
      status: 'published',
      passingScore: 70,
      totalScore: 100,
      startDate: now,
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      attempts: 2,
      timeLimit: 3600,
      questions: [
        {
          _id: this._generateId(),
          type: 'single_choice',
          content: 'React 是什么？',
          options: ['一个后端框架', '一个用于构建用户界面的 JavaScript 库', '一个数据库', '一种编程语言'],
          correctAnswer: '一个用于构建用户界面的 JavaScript 库',
          score: 10,
          explanation: 'React 是由 Facebook 开发的用于构建用户界面的 JavaScript 库。'
        }
      ],
      stats: {
        submittedCount: 3,
        gradedCount: 0,
        avgScore: 0
      },
      createdAt: now,
      updatedAt: now
    });

    const question1Id = this._generateId();
    this.questions.set(question1Id, {
      _id: question1Id,
      title: 'var、let、const 的区别是什么？',
      content: '我在学习 JavaScript 变量声明时，遇到了 var、let、const 三种方式，请问它们之间有什么区别？什么时候应该使用哪种？',
      course: course1Id,
      courseInfo: { title: 'JavaScript 从入门到精通' },
      user: studentId,
      userInfo: { username: '王学员', avatar: '' },
      tags: ['JavaScript', '变量', '基础'],
      status: 'open',
      views: 15,
      likeCount: 3,
      likes: [],
      answerCount: 2,
      answers: [
        {
          _id: this._generateId(),
          user: teacherId,
          userInfo: { username: '张教授', avatar: '', role: 'teacher' },
          content: '这是一个非常好的问题！var、let、const 的主要区别在于作用域和可变性：\n\n1. **作用域**：\n   - var：函数作用域\n   - let/const：块级作用域\n\n2. **变量提升**：\n   - var：存在变量提升\n   - let/const：不存在变量提升\n\n3. **重新赋值**：\n   - var/let：可以重新赋值\n   - const：不能重新赋值\n\n**使用建议**：\n- 默认使用 const\n- 需要重新赋值时使用 let\n- 尽量避免使用 var',
          likeCount: 5,
          likes: [studentId],
          isAccepted: false,
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    const question2Id = this._generateId();
    this.questions.set(question2Id, {
      _id: question2Id,
      title: 'React 中如何处理表单数据？',
      content: '我正在学习 React 表单处理，请问受控组件和非受控组件有什么区别？应该如何选择？',
      course: course2Id,
      courseInfo: { title: 'React 实战开发' },
      user: studentId,
      userInfo: { username: '王学员', avatar: '' },
      tags: ['React', '表单', '受控组件'],
      status: 'open',
      views: 8,
      likeCount: 0,
      likes: [],
      answerCount: 0,
      answers: [],
      createdAt: now,
      updatedAt: now
    });

    const enrollment1Id = this._generateId();
    this.enrollments.set(enrollment1Id, {
      _id: enrollment1Id,
      user: studentId,
      userInfo: { username: '王学员', avatar: '' },
      course: course1Id,
      courseInfo: { title: 'JavaScript 从入门到精通', coverImage: '' },
      status: 'active',
      progress: 45,
      totalWatchTime: 7200,
      lastWatchedAt: now,
      completedLessons: ['lesson1'],
      completedChapters: [],
      certificates: [],
      createdAt: now,
      updatedAt: now
    });

    const order1Id = this._generateId();
    const orderNo = 'ORD' + Date.now().toString().slice(-10);
    this.orders.set(order1Id, {
      _id: order1Id,
      orderNo: orderNo,
      user: studentId,
      userInfo: { username: '王学员', avatar: '', email: 'student@learning.com' },
      course: course1Id,
      courseInfo: { title: 'JavaScript 从入门到精通', price: 299, originalPrice: 599, coverImage: '' },
      totalAmount: 299,
      discountAmount: 0,
      payAmount: 299,
      status: 'completed',
      paymentMethod: 'alipay',
      paymentInfo: { tradeNo: '20240429123456' },
      timeline: [
        { time: now, description: '订单创建' },
        { time: now, description: '支付成功' }
      ],
      createdAt: now,
      paidAt: now,
      updatedAt: now
    });

    const cert1Id = this._generateId();
    this.certificates.set(cert1Id, {
      _id: cert1Id,
      certificateNo: 'CERT' + Date.now().toString(),
      user: studentId,
      userInfo: { username: '王学员', avatar: '' },
      course: course1Id,
      courseInfo: { title: 'JavaScript 从入门到精通', teacher: '张教授' },
      type: 'completion',
      status: 'valid',
      score: 92,
      completionTime: 120,
      issueDate: now,
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now
    });
  }

  _generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  _hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'salt-key').digest('hex');
  }

  comparePassword(password, hashedPassword) {
    return this._hashPassword(password) === hashedPassword;
  }

  create(collection, data) {
    const id = this._generateId();
    const now = new Date().toISOString();
    const document = {
      _id: id,
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
    this[collection].set(id, document);
    return document;
  }

  findById(collection, id) {
    return this[collection].get(id) || null;
  }

  findOne(collection, query) {
    for (const doc of this[collection].values()) {
      let match = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          match = false;
          break;
        }
      }
      if (match) return doc;
    }
    return null;
  }

  find(collection, query = {}) {
    const results = [];
    for (const doc of this[collection].values()) {
      let match = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          match = false;
          break;
        }
      }
      if (match) results.push(doc);
    }
    return results;
  }

  findByIdAndUpdate(collection, id, update) {
    const doc = this[collection].get(id);
    if (!doc) return null;
    const updatedDoc = {
      ...doc,
      ...update,
      updatedAt: new Date().toISOString()
    };
    this[collection].set(id, updatedDoc);
    return updatedDoc;
  }

  findByIdAndDelete(collection, id) {
    const doc = this[collection].get(id);
    if (!doc) return null;
    this[collection].delete(id);
    return doc;
  }

  countDocuments(collection, query = {}) {
    return this.find(collection, query).length;
  }
}

const db = new MemoryStore();

module.exports = db;
