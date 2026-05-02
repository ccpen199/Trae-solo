import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataAnalysis' }
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/ticket/TicketList.vue'),
        meta: { title: '工单管理', icon: 'Document' }
      },
      {
        path: 'tickets/create',
        name: 'TicketCreate',
        component: () => import('@/views/ticket/TicketForm.vue'),
        meta: { title: '创建工单', hidden: true }
      },
      {
        path: 'tickets/:id',
        name: 'TicketDetail',
        component: () => import('@/views/ticket/TicketDetail.vue'),
        meta: { title: '工单详情', hidden: true }
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/views/alert/AlertList.vue'),
        meta: { title: '告警管理', icon: 'Bell' }
      },
      {
        path: 'rules',
        name: 'Rules',
        component: () => import('@/views/rule/RuleList.vue'),
        meta: { title: '告警规则', icon: 'Setting' }
      },
      {
        path: 'rules/create',
        name: 'RuleCreate',
        component: () => import('@/views/rule/RuleForm.vue'),
        meta: { title: '创建规则', hidden: true }
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/message/MessageList.vue'),
        meta: { title: '消息中心', icon: 'Message' }
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/audit/AuditLog.vue'),
        meta: { title: '审计日志', icon: 'View' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const token = localStorage.getItem('token');
  
  document.title = to.meta.title ? `${to.meta.title} - 监控告警平台` : '监控告警平台';
  
  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }
  
  if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' });
    return;
  }
  
  if (token && !userStore.isLoggedIn) {
    try {
      await userStore.fetchUserInfo();
    } catch (error) {
      localStorage.removeItem('token');
      next({ name: 'Login' });
      return;
    }
  }
  
  next();
});

export default router;
