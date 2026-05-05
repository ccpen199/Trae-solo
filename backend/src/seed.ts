import 'reflect-metadata';
import { initializeDatabase, AppDataSource } from './config/database';
import { User, UserRole } from './entities/User';
import { CourseCategory, Course } from './entities/Course';
import { Resource, ResourceType, ResourceAccessLevel } from './entities/Resource';
import { Job, JobType, JobStatus, EmploymentGuide } from './entities/Job';
import { TestPaper, TestQuestion, QuestionType } from './entities/Test';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  try {
    await initializeDatabase();
    
    console.log('📦 开始创建种子数据...\n');

    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(CourseCategory);
    const courseRepository = AppDataSource.getRepository(Course);
    const resourceRepository = AppDataSource.getRepository(Resource);
    const jobRepository = AppDataSource.getRepository(Job);
    const guideRepository = AppDataSource.getRepository(EmploymentGuide);
    const testPaperRepository = AppDataSource.getRepository(TestPaper);
    const testQuestionRepository = AppDataSource.getRepository(TestQuestion);

    const existingUsers = await userRepository.count();
    if (existingUsers === 0) {
      console.log('👥 创建用户数据...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const users = [
        { username: 'admin', email: 'admin@zhihui.com', password: hashedPassword, role: UserRole.ADMIN, nickname: '管理员' },
        { username: 'teacher', email: 'teacher@zhihui.com', password: hashedPassword, role: UserRole.TEACHER, nickname: '张老师' },
        { username: 'student', email: 'student@zhihui.com', password: hashedPassword, role: UserRole.STUDENT, nickname: '小明同学' },
        { username: 'employee', email: 'employee@zhihui.com', password: hashedPassword, role: UserRole.EMPLOYEE, nickname: '在职学习者' },
        { username: 'programmer', email: 'programmer@zhihui.com', password: hashedPassword, role: UserRole.PROGRAMMER, nickname: '程序员小王' }
      ];

      for (const userData of users) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
      }
      console.log('✅ 用户数据创建完成\n');
    }

    const existingCategories = await categoryRepository.count();
    if (existingCategories === 0) {
      console.log('📚 创建课程分类数据...');

      const itCategory = categoryRepository.create({
        name: 'IT开发',
        description: '计算机编程、软件开发相关课程',
        level: 0,
        sort: 1
      });
      await categoryRepository.save(itCategory);

      const designCategory = categoryRepository.create({
        name: '设计创意',
        description: 'UI设计、平面设计、视频剪辑等',
        level: 0,
        sort: 2
      });
      await categoryRepository.save(designCategory);

      const languageCategory = categoryRepository.create({
        name: '语言学习',
        description: '英语、日语、韩语等语言课程',
        level: 0,
        sort: 3
      });
      await categoryRepository.save(languageCategory);

      const businessCategory = categoryRepository.create({
        name: '职场技能',
        description: '办公软件、项目管理、职场沟通等',
        level: 0,
        sort: 4
      });
      await categoryRepository.save(businessCategory);

      const webDevSub = categoryRepository.create({
        name: 'Web前端开发',
        description: 'HTML、CSS、JavaScript、Vue、React等',
        level: 1,
        parentId: itCategory.id,
        sort: 1
      });
      await categoryRepository.save(webDevSub);

      const backendSub = categoryRepository.create({
        name: '后端开发',
        description: 'Java、Python、Node.js、Go等',
        level: 1,
        parentId: itCategory.id,
        sort: 2
      });
      await categoryRepository.save(backendSub);

      const mobileSub = categoryRepository.create({
        name: '移动开发',
        description: 'Android、iOS、Flutter等',
        level: 1,
        parentId: itCategory.id,
        sort: 3
      });
      await categoryRepository.save(mobileSub);

      const vueSub = categoryRepository.create({
        name: 'Vue.js框架',
        description: 'Vue2、Vue3、Vuex、Pinia等',
        level: 2,
        parentId: webDevSub.id,
        sort: 1
      });
      await categoryRepository.save(vueSub);

      const reactSub = categoryRepository.create({
        name: 'React框架',
        description: 'React、Redux、React Router等',
        level: 2,
        parentId: webDevSub.id,
        sort: 2
      });
      await categoryRepository.save(reactSub);

      console.log('✅ 课程分类数据创建完成\n');

      console.log('📖 创建课程数据...');
      
      const courses = [
        {
          title: 'Vue3 + TypeScript 企业级实战',
          description: '从零开始学习Vue3，掌握Composition API、TypeScript集成、组件设计模式等核心技术，打造企业级应用。',
          categoryId: vueSub.id,
          price: 299,
          originalPrice: 599,
          duration: 48,
          studentCount: 1256,
          isFeatured: true,
          status: 'published'
        },
        {
          title: 'React 18 从入门到精通',
          description: '全面讲解React 18新特性，包括Concurrent Mode、Suspense、React Server Components等。',
          categoryId: reactSub.id,
          price: 299,
          originalPrice: 499,
          duration: 42,
          studentCount: 986,
          isFeatured: true,
          status: 'published'
        },
        {
          title: 'JavaScript 高级编程精讲',
          description: '深入理解JavaScript核心概念，包括闭包、原型链、异步编程、设计模式等高级内容。',
          categoryId: webDevSub.id,
          price: 199,
          originalPrice: 399,
          duration: 36,
          studentCount: 2341,
          isFeatured: true,
          status: 'published'
        },
        {
          title: 'Node.js 后端开发实战',
          description: '学习Node.js+Express+MongoDB技术栈，构建高性能后端服务，掌握RESTful API设计。',
          categoryId: backendSub.id,
          price: 259,
          originalPrice: 459,
          duration: 32,
          studentCount: 876,
          isFeatured: false,
          status: 'published'
        },
        {
          title: 'Python 数据分析与机器学习',
          description: '从Python基础到数据分析，再到机器学习入门，掌握NumPy、Pandas、Scikit-learn等工具。',
          categoryId: backendSub.id,
          price: 399,
          originalPrice: 699,
          duration: 56,
          studentCount: 1543,
          isFeatured: true,
          status: 'published'
        },
        {
          title: 'HTML5 + CSS3 前端基础',
          description: '适合零基础学员，系统学习HTML语义化标签、CSS3动画、Flexbox、Grid布局等核心知识。',
          categoryId: webDevSub.id,
          price: 0,
          originalPrice: 99,
          duration: 24,
          studentCount: 5672,
          isFeatured: false,
          status: 'published'
        }
      ];

      for (const courseData of courses) {
        const course = courseRepository.create(courseData);
        await courseRepository.save(course);
      }
      console.log('✅ 课程数据创建完成\n');
    }

    const existingResources = await resourceRepository.count();
    if (existingResources === 0) {
      console.log('📥 创建资源数据...');

      const resources = [
        {
          title: 'Vue3 官方中文文档',
          description: 'Vue.js 3.x 官方中文文档，包含完整的API参考和最佳实践指南。',
          type: ResourceType.DOCUMENT,
          accessLevel: ResourceAccessLevel.PUBLIC,
          downloadCount: 3456
        },
        {
          title: 'JavaScript 高级教程视频合集',
          description: '包含闭包、原型链、异步编程等核心概念的视频讲解。',
          type: ResourceType.VIDEO,
          accessLevel: ResourceAccessLevel.LOGIN_REQUIRED,
          downloadCount: 2143
        },
        {
          title: 'VS Code 常用插件推荐包',
          description: '精选前端开发必备的VS Code插件集合，提升开发效率。',
          type: ResourceType.SOFTWARE,
          accessLevel: ResourceAccessLevel.PUBLIC,
          downloadCount: 5678
        },
        {
          title: 'React 设计模式精讲文档',
          description: '深入讲解React开发中常用的设计模式和最佳实践。',
          type: ResourceType.DOCUMENT,
          accessLevel: ResourceAccessLevel.LOGIN_REQUIRED,
          downloadCount: 1234
        },
        {
          title: '教师专属教学资源包',
          description: '包含PPT模板、教学大纲、习题集等教师专用资源。',
          type: ResourceType.DOCUMENT,
          accessLevel: ResourceAccessLevel.TEACHER_ONLY,
          downloadCount: 56
        }
      ];

      for (const resourceData of resources) {
        const resource = resourceRepository.create(resourceData);
        await resourceRepository.save(resource);
      }
      console.log('✅ 资源数据创建完成\n');
    }

    const existingJobs = await jobRepository.count();
    if (existingJobs === 0) {
      console.log('💼 创建招聘数据...');

      const jobs = [
        {
          title: '高级前端开发工程师',
          companyName: '字节跳动',
          description: '负责公司核心产品的前端开发工作，参与技术架构设计。',
          requirements: '3年以上前端开发经验，精通React/Vue，熟悉TypeScript。',
          benefits: '六险一金、弹性工作、免费三餐、健身房、年度旅游。',
          type: JobType.FULL_TIME,
          location: '北京市海淀区',
          salaryRange: '25K-45K',
          experienceLevel: '3-5年',
          educationLevel: '本科及以上',
          status: JobStatus.ACTIVE,
          viewCount: 1234
        },
        {
          title: 'Java后端开发工程师',
          companyName: '阿里巴巴',
          description: '负责电商平台核心系统的设计与开发，保障系统高可用。',
          requirements: '熟悉Java生态，有微服务经验，了解分布式系统设计。',
          benefits: '股票期权、年终奖金、带薪年假、定期体检。',
          type: JobType.FULL_TIME,
          location: '杭州市余杭区',
          salaryRange: '20K-40K',
          experienceLevel: '2-4年',
          educationLevel: '本科及以上',
          status: JobStatus.ACTIVE,
          viewCount: 987
        },
        {
          title: '前端实习工程师',
          companyName: '腾讯科技',
          description: '参与QQ音乐Web端开发，学习大厂工作流程和技术规范。',
          requirements: '熟悉HTML/CSS/JS，了解React或Vue框架，有项目经验优先。',
          benefits: '实习补贴、导师指导、转正机会、免费食堂。',
          type: JobType.INTERNSHIP,
          location: '深圳市南山区',
          salaryRange: '300-500元/天',
          experienceLevel: '在校学生',
          educationLevel: '本科及以上',
          status: JobStatus.ACTIVE,
          viewCount: 2345
        },
        {
          title: '远程前端开发工程师',
          companyName: '创业公司',
          description: '负责公司产品的前端开发，可全职远程办公。',
          requirements: '2年以上前端经验，能够独立完成项目开发。',
          benefits: '远程办公、灵活时间、项目奖金。',
          type: JobType.REMOTE,
          location: '远程',
          salaryRange: '15K-25K',
          experienceLevel: '2-3年',
          educationLevel: '大专及以上',
          status: JobStatus.ACTIVE,
          viewCount: 1567
        }
      ];

      for (const jobData of jobs) {
        const job = jobRepository.create(jobData);
        await jobRepository.save(job);
      }
      console.log('✅ 招聘数据创建完成\n');

      console.log('📋 创建就业指导数据...');

      const guides = [
        {
          title: '2024年前端开发面试指南',
          content: '本文档汇总了前端开发面试中常见的问题和最佳答案，包括HTML、CSS、JavaScript、框架、工程化等方面。\n\n一、HTML相关\n1. HTML语义化标签有哪些好处？\n2. 块级元素和行内元素的区别？\n\n二、CSS相关\n1. Flexbox和Grid布局的使用场景？\n2. CSS选择器优先级如何计算？\n\n三、JavaScript相关\n1. 闭包的概念和应用场景？\n2. 原型链的理解？\n\n四、框架相关\n1. React和Vue的区别？\n2. 虚拟DOM的原理？',
          viewCount: 5678
        },
        {
          title: '简历撰写技巧与模板',
          content: '一份好的简历是求职成功的第一步。本文将分享简历撰写的技巧和模板。\n\n一、简历结构\n1. 个人信息：简洁明了\n2. 求职意向：明确目标\n3. 技能清单：突出优势\n4. 项目经验：STAR法则\n5. 教育背景\n\n二、注意事项\n1. 一页纸原则\n2. 数据量化成果\n3. 避免模板化套话\n4. 根据岗位定制简历',
          viewCount: 4321
        },
        {
          title: '职场新人生存指南',
          content: '刚步入职场的新人，如何快速适应工作环境？\n\n一、心态调整\n1. 从学生到职场人的转变\n2. 主动学习而非被动等待\n3. 建立良好的沟通习惯\n\n二、工作方法\n1. 任务优先级管理\n2. 及时沟通反馈\n3. 文档化工作成果\n\n三、人际关系\n1. 尊重每一位同事\n2. 学会求助与帮助他人\n3. 保持专业的工作态度',
          viewCount: 3456
        }
      ];

      for (const guideData of guides) {
        const guide = guideRepository.create(guideData);
        await guideRepository.save(guide);
      }
      console.log('✅ 就业指导数据创建完成\n');
    }

    const existingTests = await testPaperRepository.count();
    if (existingTests === 0) {
      console.log('📝 创建测试数据...');

      const paper1 = testPaperRepository.create({
        title: 'JavaScript 基础测试',
        description: '测试JavaScript基础语法和核心概念的掌握程度',
        duration: 30,
        totalScore: 100,
        passScore: 60,
        isFree: true
      });
      await testPaperRepository.save(paper1);

      const questions1 = [
        {
          testPaperId: paper1.id,
          type: QuestionType.SINGLE_CHOICE,
          content: '以下哪个不是JavaScript的数据类型？',
          options: JSON.stringify(['A. String', 'B. Boolean', 'C. Float', 'D. Object']),
          correctAnswer: 'C',
          explanation: 'JavaScript中的数字类型只有Number，没有单独的Float类型',
          score: 20
        },
        {
          testPaperId: paper1.id,
          type: QuestionType.SINGLE_CHOICE,
          content: '以下哪个方法可以用来判断一个变量是否是数组？',
          options: JSON.stringify(['A. typeof', 'B. instanceof', 'C. Array.isArray()', 'D. isArray()']),
          correctAnswer: 'C',
          explanation: 'Array.isArray()是最可靠的数组判断方法',
          score: 20
        },
        {
          testPaperId: paper1.id,
          type: QuestionType.JUDGMENT,
          content: 'JavaScript中的var声明的变量有块级作用域。',
          options: JSON.stringify(['A. 正确', 'B. 错误']),
          correctAnswer: 'B',
          explanation: 'var声明的变量只有函数作用域，let和const才有块级作用域',
          score: 20
        },
        {
          testPaperId: paper1.id,
          type: QuestionType.SINGLE_CHOICE,
          content: '以下哪个不是ES6新增的特性？',
          options: JSON.stringify(['A. let/const', 'B. 箭头函数', 'C. Promise', 'D. $.ajax']),
          correctAnswer: 'D',
          explanation: '$.ajax是jQuery中的方法，不是ES6特性',
          score: 20
        },
        {
          testPaperId: paper1.id,
          type: QuestionType.SINGLE_CHOICE,
          content: 'console.log(typeof null)的输出结果是？',
          options: JSON.stringify(['A. null', 'B. undefined', 'C. object', 'D. string']),
          correctAnswer: 'C',
          explanation: '这是JavaScript的一个历史遗留bug，typeof null返回"object"',
          score: 20
        }
      ];

      for (const q of questions1) {
        const question = testQuestionRepository.create(q);
        await testQuestionRepository.save(question);
      }

      const paper2 = testPaperRepository.create({
        title: 'Vue3 入门测试',
        description: '测试Vue3基础语法和Composition API的掌握程度',
        duration: 45,
        totalScore: 100,
        passScore: 60,
        isFree: true
      });
      await testPaperRepository.save(paper2);

      const questions2 = [
        {
          testPaperId: paper2.id,
          type: QuestionType.SINGLE_CHOICE,
          content: 'Vue3中创建响应式对象应该使用哪个API？',
          options: JSON.stringify(['A. Vue.observable()', 'B. reactive()', 'C. data()', 'D. computed()']),
          correctAnswer: 'B',
          explanation: 'Vue3中使用reactive()创建响应式对象，ref()用于基本类型',
          score: 25
        },
        {
          testPaperId: paper2.id,
          type: QuestionType.SINGLE_CHOICE,
          content: '以下哪个是Vue3的生命周期钩子函数？',
          options: JSON.stringify(['A. beforeMount', 'B. onMounted', 'C. mounted', 'D. created']),
          correctAnswer: 'B',
          explanation: 'Vue3 Composition API中使用onMounted等钩子函数',
          score: 25
        },
        {
          testPaperId: paper2.id,
          type: QuestionType.JUDGMENT,
          content: 'Vue3中移除了beforeCreate和created生命周期钩子。',
          options: JSON.stringify(['A. 正确', 'B. 错误']),
          correctAnswer: 'B',
          explanation: 'Vue3中仍有这些钩子，但在Composition API中建议使用setup函数代替',
          score: 25
        },
        {
          testPaperId: paper2.id,
          type: QuestionType.SINGLE_CHOICE,
          content: '在setup函数中访问props，以下哪个说法正确？',
          options: JSON.stringify(['A. 直接使用this.props', 'B. 使用props参数', 'C. 使用inject获取', 'D. 无法访问']),
          correctAnswer: 'B',
          explanation: 'setup函数接收props作为第一个参数',
          score: 25
        }
      ];

      for (const q of questions2) {
        const question = testQuestionRepository.create(q);
        await testQuestionRepository.save(question);
      }

      console.log('✅ 测试数据创建完成\n');
    }

    console.log('========================================');
    console.log('  🎉 所有种子数据创建完成！');
    console.log('========================================');
    console.log('');
    console.log('📋 默认测试账号：');
    console.log('  - 管理员: admin / 123456');
    console.log('  - 教师: teacher / 123456');
    console.log('  - 学生: student / 123456');
    console.log('  - 在职人员: employee / 123456');
    console.log('  - 程序员: programmer / 123456');
    console.log('');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    process.exit(1);
  }
};

seedData();
