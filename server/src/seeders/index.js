require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');

const connectDB = require('../config/database');

const seedData = async () => {
  try {
    await connectDB();

    console.log('清空现有数据...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Question.deleteMany({});

    console.log('创建默认用户账号...');

    const admin = await User.create({
      username: '系统管理员',
      email: process.env.ADMIN_EMAIL || 'admin@learning.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      role: 'admin',
      avatar: '',
      bio: '在线教育平台系统管理员',
      status: 'active'
    });

    const teacher = await User.create({
      username: '张教授',
      email: process.env.TEACHER_EMAIL || 'teacher@learning.com',
      password: process.env.TEACHER_PASSWORD || 'teacher123456',
      role: 'teacher',
      avatar: '',
      bio: '计算机科学与技术学院教授，拥有15年教学经验。专注于Web开发、人工智能和数据科学领域。',
      status: 'active'
    });

    const ta = await User.create({
      username: '李助教',
      email: process.env.TA_EMAIL || 'ta@learning.com',
      password: process.env.TA_PASSWORD || 'ta123456',
      role: 'ta',
      avatar: '',
      bio: '计算机科学专业研究生，热爱编程和教学。负责课程作业批改和答疑。',
      status: 'active'
    });

    const student = await User.create({
      username: '王学员',
      email: process.env.STUDENT_EMAIL || 'student@learning.com',
      password: process.env.STUDENT_PASSWORD || 'student123456',
      role: 'student',
      avatar: '',
      bio: '热爱学习的程序员，正在提升自己的技术能力。',
      status: 'active'
    });

    console.log('创建示例课程...');

    const course1 = await Course.create({
      title: 'JavaScript 从入门到精通',
      description: '本课程将带你从零开始学习 JavaScript，涵盖基础语法、函数、对象、异步编程等核心概念。通过大量实战项目，帮助你掌握现代 Web 开发技能。',
      coverImage: '',
      category: '前端开发',
      tags: ['JavaScript', '前端', 'Web开发'],
      price: 299,
      originalPrice: 599,
      teacher: teacher._id,
      status: 'published',
      difficulty: 'beginner',
      estimatedDuration: 36000,
      chapters: [
        {
          title: '第一章：JavaScript 基础',
          description: '学习 JavaScript 的基本语法和数据类型',
          sortOrder: 1,
          lessons: [
            {
              title: '1.1 什么是 JavaScript',
              description: '了解 JavaScript 的历史和用途',
              videoUrl: '',
              duration: 900,
              freePreview: true,
              sortOrder: 1
            },
            {
              title: '1.2 变量和数据类型',
              description: '学习 var、let、const 和基本数据类型',
              videoUrl: '',
              duration: 1200,
              freePreview: true,
              sortOrder: 2
            },
            {
              title: '1.3 运算符和表达式',
              description: '学习算术、比较、逻辑运算符',
              videoUrl: '',
              duration: 1000,
              freePreview: false,
              sortOrder: 3
            }
          ]
        },
        {
          title: '第二章：函数和对象',
          description: '深入学习 JavaScript 的核心概念',
          sortOrder: 2,
          lessons: [
            {
              title: '2.1 函数的定义和调用',
              description: '学习函数声明、函数表达式和箭头函数',
              videoUrl: '',
              duration: 1500,
              freePreview: false,
              sortOrder: 1
            },
            {
              title: '2.2 对象的创建和使用',
              description: '学习对象字面量、构造函数和类',
              videoUrl: '',
              duration: 1800,
              freePreview: false,
              sortOrder: 2
            }
          ]
        },
        {
          title: '第三章：异步编程',
          description: '掌握现代 JavaScript 异步编程模式',
          sortOrder: 3,
          lessons: [
            {
              title: '3.1 回调函数',
              description: '理解回调函数和回调地狱',
              videoUrl: '',
              duration: 1200,
              freePreview: false,
              sortOrder: 1
            },
            {
              title: '3.2 Promise',
              description: '学习 Promise 的使用和链式调用',
              videoUrl: '',
              duration: 1500,
              freePreview: false,
              sortOrder: 2
            },
            {
              title: '3.3 async/await',
              description: '掌握现代异步编程语法',
              videoUrl: '',
              duration: 1300,
              freePreview: false,
              sortOrder: 3
            }
          ]
        }
      ]
    });

    const course2 = await Course.create({
      title: 'React 实战开发',
      description: '本课程将带你深入学习 React 框架，从基础到高级，涵盖组件开发、状态管理、路由、性能优化等核心内容。',
      coverImage: '',
      category: '前端开发',
      tags: ['React', '前端', '组件化'],
      price: 399,
      originalPrice: 699,
      teacher: teacher._id,
      status: 'published',
      difficulty: 'intermediate',
      estimatedDuration: 45000,
      chapters: [
        {
          title: '第一章：React 入门',
          description: '了解 React 的核心概念和开发环境',
          sortOrder: 1,
          lessons: [
            {
              title: '1.1 React 简介',
              description: '了解 React 的由来和优势',
              videoUrl: '',
              duration: 800,
              freePreview: true,
              sortOrder: 1
            },
            {
              title: '1.2 开发环境搭建',
              description: '使用 Create React App 快速搭建项目',
              videoUrl: '',
              duration: 1000,
              freePreview: true,
              sortOrder: 2
            }
          ]
        },
        {
          title: '第二章：组件开发',
          description: '深入学习 React 组件开发',
          sortOrder: 2,
          lessons: [
            {
              title: '2.1 函数组件和类组件',
              description: '学习两种组件的定义方式',
              videoUrl: '',
              duration: 1400,
              freePreview: false,
              sortOrder: 1
            },
            {
              title: '2.2 Props 和 State',
              description: '理解组件的数据传递和状态管理',
              videoUrl: '',
              duration: 1600,
              freePreview: false,
              sortOrder: 2
            }
          ]
        }
      ]
    });

    const course3 = await Course.create({
      title: 'Python 数据分析实战',
      description: '从零开始学习 Python 数据分析，掌握 NumPy、Pandas、Matplotlib 等核心库，通过实际项目提升数据分析能力。',
      coverImage: '',
      category: '数据科学',
      tags: ['Python', '数据分析', 'Pandas'],
      price: 349,
      originalPrice: 599,
      teacher: teacher._id,
      status: 'published',
      difficulty: 'intermediate',
      estimatedDuration: 40000,
      chapters: [
        {
          title: '第一章：Python 基础回顾',
          description: '快速回顾 Python 核心语法',
          sortOrder: 1,
          lessons: [
            {
              title: '1.1 Python 数据结构',
              description: '列表、字典、元组、集合',
              videoUrl: '',
              duration: 1200,
              freePreview: true,
              sortOrder: 1
            },
            {
              title: '1.2 函数和模块',
              description: '函数定义、参数传递、模块导入',
              videoUrl: '',
              duration: 1000,
              freePreview: false,
              sortOrder: 2
            }
          ]
        }
      ]
    });

    console.log('创建示例作业...');

    const assignment1 = await Assignment.create({
      title: '第一章课后作业',
      description: '完成 JavaScript 基础语法练习，包括变量声明、数据类型转换、运算符使用等。',
      course: course1._id,
      teacher: teacher._id,
      type: 'homework',
      status: 'published',
      passingScore: 60,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      attempts: 3,
      questions: [
        {
          type: 'single_choice',
          content: '以下哪个不是 JavaScript 的基本数据类型？',
          options: ['String', 'Number', 'Array', 'Boolean'],
          correctAnswer: 'Array',
          score: 10,
          explanation: 'Array 是引用数据类型，不是基本数据类型。JavaScript 的基本数据类型包括：String、Number、Boolean、Null、Undefined、Symbol、BigInt。'
        },
        {
          type: 'single_choice',
          content: 'var、let、const 的主要区别是什么？',
          options: [
            '没有区别',
            '作用域和可变性不同',
            '只有 var 可以声明变量',
            'const 不能声明对象'
          ],
          correctAnswer: '作用域和可变性不同',
          score: 10,
          explanation: 'var 是函数作用域，let 和 const 是块级作用域。const 声明的变量不能重新赋值，但对象的属性可以修改。'
        },
        {
          type: 'multiple_choice',
          content: '以下哪些是 JavaScript 的数据类型？（多选）',
          options: ['undefined', 'null', 'symbol', 'integer'],
          correctAnswer: ['undefined', 'null', 'symbol'],
          score: 15,
          explanation: 'JavaScript 中没有单独的 integer 类型，所有数字都是 Number 类型。'
        },
        {
          type: 'true_false',
          content: 'JavaScript 是一种强类型语言。',
          options: ['正确', '错误'],
          correctAnswer: '错误',
          score: 5,
          explanation: 'JavaScript 是弱类型（动态类型）语言，变量可以随时改变类型。'
        },
        {
          type: 'essay',
          content: '请简述 JavaScript 中 == 和 === 的区别，并举例说明。',
          correctAnswer: null,
          score: 60,
          explanation: '== 是抽象相等，会进行类型转换；=== 是严格相等，不会进行类型转换。例如：1 == "1" 返回 true，但 1 === "1" 返回 false。'
        }
      ]
    });

    const assignment2 = await Assignment.create({
      title: '第一章单元测验',
      description: '测验你对 React 基础概念的掌握程度。',
      course: course2._id,
      teacher: teacher._id,
      type: 'quiz',
      status: 'published',
      passingScore: 70,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      timeLimit: 3600,
      attempts: 2,
      questions: [
        {
          type: 'single_choice',
          content: 'React 是什么？',
          options: [
            '一个后端框架',
            '一个用于构建用户界面的 JavaScript 库',
            '一个数据库',
            '一种编程语言'
          ],
          correctAnswer: '一个用于构建用户界面的 JavaScript 库',
          score: 10,
          explanation: 'React 是由 Facebook 开发的用于构建用户界面的 JavaScript 库。'
        },
        {
          type: 'single_choice',
          content: 'JSX 是什么？',
          options: [
            '一种新的编程语言',
            'JavaScript 的语法扩展',
            '一个数据库查询语言',
            '一种样式语言'
          ],
          correctAnswer: 'JavaScript 的语法扩展',
          score: 10,
          explanation: 'JSX 是 JavaScript 的语法扩展，看起来类似于 HTML，让我们可以在 JavaScript 中写类似 HTML 的代码。'
        },
        {
          type: 'true_false',
          content: '在 React 中，组件的状态应该直接修改。',
          options: ['正确', '错误'],
          correctAnswer: '错误',
          score: 5,
          explanation: '在 React 中，应该使用 setState（类组件）或 useState 的更新函数（函数组件）来修改状态，而不是直接修改。'
        }
      ]
    });

    const assignment3 = await Assignment.create({
      title: '期末考试：JavaScript 综合应用',
      description: '综合考核 JavaScript 的核心知识点，包括基础语法、异步编程、DOM 操作等。',
      course: course1._id,
      teacher: teacher._id,
      type: 'exam',
      status: 'published',
      passingScore: 60,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      timeLimit: 7200,
      attempts: 1,
      questions: [
        {
          type: 'single_choice',
          content: '以下哪个方法可以用于数组扁平化？',
          options: ['map()', 'filter()', 'flat()', 'reduce()'],
          correctAnswer: 'flat()',
          score: 10,
          explanation: 'Array.prototype.flat() 方法会按照一个可指定的深度递归遍历数组，并将所有元素与遍历到的子数组中的元素合并为一个新数组返回。'
        },
        {
          type: 'single_choice',
          content: 'Promise.all() 和 Promise.race() 的区别是什么？',
          options: [
            '没有区别',
            'all 等待所有 Promise 完成，race 等待第一个完成',
            'all 只返回第一个结果，race 返回所有结果',
            'all 只能用于数组，race 可以用于任何可迭代对象'
          ],
          correctAnswer: 'all 等待所有 Promise 完成，race 等待第一个完成',
          score: 15,
          explanation: 'Promise.all() 接收一个 Promise 数组，当所有 Promise 都完成时返回结果数组；Promise.race() 当第一个 Promise 完成或拒绝时就返回结果。'
        },
        {
          type: 'multiple_choice',
          content: '以下哪些是 ES6 新增的特性？（多选）',
          options: ['let/const', '箭头函数', 'Promise', 'var 关键字'],
          correctAnswer: ['let/const', '箭头函数', 'Promise'],
          score: 15,
          explanation: 'var 关键字是 JavaScript 早期就有的特性，let、const、箭头函数、Promise 都是 ES6（ES2015）新增的特性。'
        },
        {
          type: 'essay',
          content: '请简述 JavaScript 的事件循环机制（Event Loop），包括调用栈、任务队列、宏任务和微任务的概念。',
          correctAnswer: null,
          score: 60,
          explanation: 'JavaScript 是单线程语言，通过事件循环机制处理异步操作。调用栈用于执行同步代码，任务队列存放异步任务。宏任务包括 setTimeout、setInterval、I/O 等，微任务包括 Promise.then、MutationObserver 等。每次事件循环会先执行所有微任务，再执行一个宏任务。'
        }
      ]
    });

    console.log('创建示例问答数据...');

    const question1 = await Question.create({
      title: 'var、let、const 的区别是什么？',
      content: '我在学习 JavaScript 变量声明时，遇到了 var、let、const 三种方式，请问它们之间有什么区别？什么时候应该使用哪种？',
      course: course1._id,
      chapterId: course1.chapters[0]._id,
      lessonId: course1.chapters[0].lessons[1]._id,
      user: student._id,
      tags: ['JavaScript', '变量', '基础'],
      status: 'open',
      views: 15,
      likes: [],
      answers: [
        {
          user: teacher._id,
          content: '这是一个非常好的问题！var、let、const 的主要区别在于作用域和可变性：\n\n1. **作用域**：\n   - var：函数作用域\n   - let/const：块级作用域\n\n2. **变量提升**：\n   - var：存在变量提升\n   - let/const：不存在变量提升（存在暂时性死区）\n\n3. **重新赋值**：\n   - var/let：可以重新赋值\n   - const：不能重新赋值（但对象属性可以修改）\n\n**使用建议**：\n- 默认使用 const\n- 需要重新赋值时使用 let\n- 尽量避免使用 var',
          likes: [student._id],
          likeCount: 1,
          isAccepted: false
        }
      ],
      answerCount: 1
    });

    const question2 = await Question.create({
      title: 'React 中如何处理表单数据？',
      content: '我正在学习 React 表单处理，请问受控组件和非受控组件有什么区别？应该如何选择？',
      course: course2._id,
      user: student._id,
      tags: ['React', '表单', '受控组件'],
      status: 'open',
      views: 8,
      likes: []
    });

    console.log('\n========================================');
    console.log('数据种子创建完成！');
    console.log('========================================\n');
    
    console.log('默认账号信息：');
    console.log('----------------------------------------');
    console.log('【管理员账号】');
    console.log(`  邮箱: ${admin.email}`);
    console.log(`  密码: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
    console.log('');
    console.log('【教师账号】');
    console.log(`  邮箱: ${teacher.email}`);
    console.log(`  密码: ${process.env.TEACHER_PASSWORD || 'teacher123456'}`);
    console.log('');
    console.log('【助教账号】');
    console.log(`  邮箱: ${ta.email}`);
    console.log(`  密码: ${process.env.TA_PASSWORD || 'ta123456'}`);
    console.log('');
    console.log('【学员账号】');
    console.log(`  邮箱: ${student.email}`);
    console.log(`  密码: ${process.env.STUDENT_PASSWORD || 'student123456'}`);
    console.log('');
    console.log('示例课程：');
    console.log('----------------------------------------');
    console.log(`1. ${course1.title} (${course1.category})`);
    console.log(`2. ${course2.title} (${course2.category})`);
    console.log(`3. ${course3.title} (${course3.category})`);
    console.log('');
    console.log('示例作业/考试：');
    console.log('----------------------------------------');
    console.log(`1. ${assignment1.title} (${assignment1.type})`);
    console.log(`2. ${assignment2.title} (${assignment2.type})`);
    console.log(`3. ${assignment3.title} (${assignment3.type})`);
    console.log('');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据种子创建失败:', error);
    process.exit(1);
  }
};

seedData();
