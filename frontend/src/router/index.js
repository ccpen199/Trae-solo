import { createRouter, createWebHistory } from 'vue-router';
import Layout from '@/layout/index.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/news',
    children: [
      {
        path: 'news',
        name: 'NewsList',
        component: () => import('@/views/news/List.vue'),
        meta: { title: '新闻管理', activeMenu: '/news' }
      },
      {
        path: 'news/create',
        name: 'NewsCreate',
        component: () => import('@/views/news/Edit.vue'),
        meta: { title: '新建新闻', activeMenu: '/news' }
      },
      {
        path: 'news/edit/:id',
        name: 'NewsEdit',
        component: () => import('@/views/news/Edit.vue'),
        meta: { title: '编辑新闻', activeMenu: '/news' }
      },
      {
        path: 'sections',
        name: 'SectionsList',
        component: () => import('@/views/sections/List.vue'),
        meta: { title: '版块设置', activeMenu: '/sections' }
      },
      {
        path: 'sections/create',
        name: 'SectionsCreate',
        component: () => import('@/views/sections/Edit.vue'),
        meta: { title: '新建版块', activeMenu: '/sections' }
      },
      {
        path: 'sections/edit/:id',
        name: 'SectionsEdit',
        component: () => import('@/views/sections/Edit.vue'),
        meta: { title: '编辑版块', activeMenu: '/sections' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 资讯CMS` : '资讯CMS管理系统';
  next();
});

export default router;
