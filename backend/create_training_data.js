const axios = require('axios');

const API = 'http://127.0.0.1:59231/api';

async function login(username, password) {
  const res = await axios.post(`${API}/auth/login`, { username, password });
  return res.data.token;
}

async function run() {
  console.log('=== 创建培训进度、测验、证书示例数据 ===');

  const worker1Token = await login('worker1', 'worker123');
  const worker2Token = await login('worker2', 'worker123');
  const worker3Token = await login('worker3', 'worker123');
  const adminToken = await login('admin', 'admin123');

  // 获取课程列表
  const coursesRes = await axios.get(`${API}/training/courses`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const courses = coursesRes.data.list;
  console.log('课程数:', courses.length);

  // worker1 (陈阿姨, cleaner) 学习保洁课程并通过测验
  console.log('=== worker1 (陈阿姨) 学习保洁课程 ===');
  const cleanerCourses = courses.filter(c => c.category === 'cleaner' || c.category === 'general');
  for (let i = 0; i < cleanerCourses.length; i++) {
    const course = cleanerCourses[i];
    console.log('  学习:', course.title);
    // 更新进度到100%
    await axios.post(
      `${API}/training/progress/${course.id}`,
      { progress: 100 },
      { headers: { Authorization: `Bearer ${worker1Token}` } }
    );
    // 如果是最后一门，提交测验
    if (i === cleanerCourses.length - 1) {
      console.log('  提交测验...');
      const courseDetail = await axios.get(`${API}/training/courses/${course.id}`, {
        headers: { Authorization: `Bearer ${worker1Token}` }
      });
      const quizzes = courseDetail.data.quizzes;
      const answers = quizzes.map((q, idx) => ({ quiz_id: q.id, answer: q.correct_answer }));
      const quizRes = await axios.post(
        `${API}/training/quiz/${course.id}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${worker1Token}` } }
      );
      console.log('  测验结果:', quizRes.data);
    }
  }

  // worker2 (刘阿姨, nanny) 学习保姆课程并通过测验
  console.log('=== worker2 (刘阿姨) 学习保姆课程 ===');
  const nannyCourses = courses.filter(c => c.category === 'nanny' || c.category === 'general');
  for (let i = 0; i < nannyCourses.length; i++) {
    const course = nannyCourses[i];
    console.log('  学习:', course.title);
    await axios.post(
      `${API}/training/progress/${course.id}`,
      { progress: 100 },
      { headers: { Authorization: `Bearer ${worker2Token}` } }
    );
    if (i === nannyCourses.length - 1) {
      console.log('  提交测验...');
      const courseDetail = await axios.get(`${API}/training/courses/${course.id}`, {
        headers: { Authorization: `Bearer ${worker2Token}` }
      });
      const quizzes = courseDetail.data.quizzes;
      const answers = quizzes.map((q, idx) => ({ quiz_id: q.id, answer: q.correct_answer }));
      const quizRes = await axios.post(
        `${API}/training/quiz/${course.id}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${worker2Token}` } }
      );
      console.log('  测验结果:', quizRes.data);
    }
  }

  // worker3 (张阿姨, maternity) 学习月嫂课程（50%进度）
  console.log('=== worker3 (张阿姨) 学习月嫂课程(50%进度) ===');
  const maternityCourses = courses.filter(c => c.category === 'maternity' || c.category === 'general');
  for (let i = 0; i < Math.ceil(maternityCourses.length / 2); i++) {
    const course = maternityCourses[i];
    console.log('  学习(50%):', course.title);
    await axios.post(
      `${API}/training/progress/${course.id}`,
      { progress: 50 },
      { headers: { Authorization: `Bearer ${worker3Token}` } }
    );
  }

  console.log('=== 完成 ===');
}

run().catch(e => {
  console.error('ERROR:', e.response?.data || e.message);
  process.exit(1);
});
