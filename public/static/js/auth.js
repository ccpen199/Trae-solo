const auth = {
  getToken() {
    return localStorage.getItem('auth_token');
  },
  
  setToken(token) {
    localStorage.setItem('auth_token', token);
  },
  
  removeToken() {
    localStorage.removeItem('auth_token');
  },
  
  getUser() {
    const userStr = localStorage.getItem('auth_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  
  setUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },
  
  removeUser() {
    localStorage.removeItem('auth_user');
  },
  
  isAuthenticated() {
    return !!this.getToken();
  },
  
  getRole() {
    const user = this.getUser();
    return user?.role || null;
  },
  
  isAdmin() {
    return this.getRole() === 'ADMIN';
  },
  
  isTeacher() {
    return this.getRole() === 'TEACHER';
  },
  
  isStudent() {
    return this.getRole() === 'STUDENT';
  },
  
  isParent() {
    return this.getRole() === 'PARENT';
  },
  
  async login(username, password) {
    const result = await api.post('/auth/login', { username, password });
    this.setToken(result.data.token);
    this.setUser(result.data.user);
    return result;
  },
  
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
    }
    this.removeToken();
    this.removeUser();
  },
  
  async refreshToken() {
    const result = await api.post('/auth/refresh');
    this.setToken(result.data.token);
    return result;
  },
  
  getDashboardRoute() {
    const role = this.getRole();
    switch (role) {
      case 'ADMIN':
        return '/dashboard.html';
      case 'TEACHER':
        return '/dashboard.html';
      case 'STUDENT':
        return '/dashboard.html';
      case 'PARENT':
        return '/dashboard.html';
      default:
        return '/login.html';
    }
  },
  
  getMenuItems() {
    const role = this.getRole();
    const user = this.getUser();
    
    const menus = {
      ADMIN: [
        { section: '首页', items: [
          { id: 'dashboard', icon: '📊', text: '工作台', page: 'dashboard' },
        ]},
        { section: '学员管理', items: [
          { id: 'students', icon: '👨‍🎓', text: '学员列表', page: 'students' },
          { id: 'enrollments', icon: '📝', text: '报名管理', page: 'enrollments' },
        ]},
        { section: '排课管理', items: [
          { id: 'schedules', icon: '📅', text: '课表管理', page: 'schedules' },
          { id: 'classrooms', icon: '🏫', text: '教室管理', page: 'classrooms' },
        ]},
        { section: '考勤管理', items: [
          { id: 'attendances', icon: '✅', text: '考勤记录', page: 'attendances' },
        ]},
        { section: '财务管理', items: [
          { id: 'consumptions', icon: '💰', text: '课消记录', page: 'consumptions' },
        ]},
        { section: '报表分析', items: [
          { id: 'reports', icon: '📈', text: '经营报表', page: 'reports' },
        ]},
        { section: '通知中心', items: [
          { id: 'notifications', icon: '🔔', text: '消息通知', page: 'notifications' },
        ]},
      ],
      TEACHER: [
        { section: '首页', items: [
          { id: 'dashboard', icon: '📊', text: '工作台', page: 'dashboard' },
        ]},
        { section: '课表管理', items: [
          { id: 'schedules', icon: '📅', text: '我的课表', page: 'schedules' },
        ]},
        { section: '考勤管理', items: [
          { id: 'attendances', icon: '✅', text: '考勤记录', page: 'attendances' },
        ]},
        { section: '学员管理', items: [
          { id: 'students', icon: '👨‍🎓', text: '我的学员', page: 'students' },
        ]},
        { section: '通知中心', items: [
          { id: 'notifications', icon: '🔔', text: '消息通知', page: 'notifications' },
        ]},
      ],
      STUDENT: [
        { section: '首页', items: [
          { id: 'dashboard', icon: '📊', text: '工作台', page: 'dashboard' },
        ]},
        { section: '我的课程', items: [
          { id: 'schedules', icon: '📅', text: '我的课表', page: 'schedules' },
          { id: 'enrollments', icon: '📝', text: '我的报名', page: 'enrollments' },
        ]},
        { section: '学习记录', items: [
          { id: 'attendances', icon: '✅', text: '考勤记录', page: 'attendances' },
          { id: 'consumptions', icon: '💰', text: '课消记录', page: 'consumptions' },
        ]},
        { section: '通知中心', items: [
          { id: 'notifications', icon: '🔔', text: '消息通知', page: 'notifications' },
        ]},
      ],
      PARENT: [
        { section: '首页', items: [
          { id: 'dashboard', icon: '📊', text: '工作台', page: 'dashboard' },
        ]},
        { section: '孩子学习', items: [
          { id: 'schedules', icon: '📅', text: '孩子课表', page: 'schedules' },
          { id: 'enrollments', icon: '📝', text: '报名记录', page: 'enrollments' },
          { id: 'attendances', icon: '✅', text: '考勤记录', page: 'attendances' },
          { id: 'consumptions', icon: '💰', text: '课时消费', page: 'consumptions' },
        ]},
        { section: '通知中心', items: [
          { id: 'notifications', icon: '🔔', text: '消息通知', page: 'notifications' },
        ]},
      ],
    };
    
    return menus[role] || menus.STUDENT;
  },
};

function checkAuth() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  if (currentPage === 'login.html') {
    if (auth.isAuthenticated()) {
      window.location.href = auth.getDashboardRoute();
    }
    return;
  }
  
  if (!auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
}

function logout() {
  auth.logout().then(() => {
    window.location.href = '/login.html';
  });
}
