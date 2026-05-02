import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('@/views/students/StudentList.vue'),
        meta: { title: '学生管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'students/:id',
        name: 'StudentDetail',
        component: () => import('@/views/students/StudentDetail.vue'),
        meta: { title: '学生详情', requiresAuth: true, roles: ['admin', 'homeroom_teacher'] }
      },
      {
        path: 'classes',
        name: 'Classes',
        component: () => import('@/views/classes/ClassList.vue'),
        meta: { title: '班级管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'teachers',
        name: 'Teachers',
        component: () => import('@/views/teachers/TeacherList.vue'),
        meta: { title: '教师管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'classrooms',
        name: 'Classrooms',
        component: () => import('@/views/classrooms/ClassroomList.vue'),
        meta: { title: '教室管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/courses/CourseList.vue'),
        meta: { title: '课程管理', requiresAuth: true, roles: ['admin', 'teacher'] }
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('@/views/schedules/ScheduleList.vue'),
        meta: { title: '课表管理', requiresAuth: true, roles: ['admin', 'teacher'] }
      },
      {
        path: 'my-schedule',
        name: 'MySchedule',
        component: () => import('@/views/schedules/MySchedule.vue'),
        meta: { title: '我的课表', requiresAuth: true }
      },
      {
        path: 'enrollments',
        name: 'Enrollments',
        component: () => import('@/views/enrollments/EnrollmentList.vue'),
        meta: { title: '选课管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'course-selection',
        name: 'CourseSelection',
        component: () => import('@/views/enrollments/CourseSelection.vue'),
        meta: { title: '在线选课', requiresAuth: true, roles: ['student'] }
      },
      {
        path: 'attendances',
        name: 'Attendances',
        component: () => import('@/views/attendances/AttendanceList.vue'),
        meta: { title: '考勤记录', requiresAuth: true, roles: ['admin', 'teacher', 'homeroom_teacher'] }
      },
      {
        path: 'attendance-take',
        name: 'AttendanceTake',
        component: () => import('@/views/attendances/AttendanceTake.vue'),
        meta: { title: '考勤录入', requiresAuth: true, roles: ['teacher'] }
      },
      {
        path: 'my-attendance',
        name: 'MyAttendance',
        component: () => import('@/views/attendances/MyAttendance.vue'),
        meta: { title: '我的考勤', requiresAuth: true, roles: ['student'] }
      },
      {
        path: 'grades',
        name: 'Grades',
        component: () => import('@/views/grades/GradeList.vue'),
        meta: { title: '成绩管理', requiresAuth: true, roles: ['admin', 'teacher', 'homeroom_teacher'] }
      },
      {
        path: 'grade-entry',
        name: 'GradeEntry',
        component: () => import('@/views/grades/GradeEntry.vue'),
        meta: { title: '成绩录入', requiresAuth: true, roles: ['teacher'] }
      },
      {
        path: 'my-grades',
        name: 'MyGrades',
        component: () => import('@/views/grades/MyGrades.vue'),
        meta: { title: '我的成绩', requiresAuth: true, roles: ['student'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/ReportList.vue'),
        meta: { title: '报表统计', requiresAuth: true, roles: ['admin', 'homeroom_teacher'] }
      },
      {
        path: 'class-students',
        name: 'ClassStudents',
        component: () => import('@/views/homeroom/ClassStudents.vue'),
        meta: { title: '班级学生', requiresAuth: true, roles: ['homeroom_teacher'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人信息', requiresAuth: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  document.title = to.meta.title ? `${to.meta.title} - 校园教务管理系统` : '校园教务管理系统';

  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    if (to.meta.roles && to.meta.roles.length > 0) {
      if (!to.meta.roles.includes(authStore.userRole)) {
        next({ name: 'Dashboard' });
        return;
      }
    }
  }

  if (to.name === 'Login' && authStore.isLoggedIn) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
