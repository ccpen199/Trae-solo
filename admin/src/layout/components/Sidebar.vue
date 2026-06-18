<template>
  <div class="sidebar-wrapper">
    <div class="logo-container">
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect rx='10' fill='%23fff' width='48' height='48'/%3E%3Cpath fill='%231E4FA5' d='M24 8L8 16v16l16 8 16-8V16z'/%3E%3Cpath fill='%23fff' d='M24 14l-10 5v10l10 5 10-5V19z' opacity='0.9'/%3E%3C/svg%3E"
        class="logo-icon"
        alt="logo"
      />
      <span v-show="!collapse" class="logo-text">郑好办<br/>管理后台</span>
    </div>

    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapse"
        :collapse-transition="false"
        background-color="transparent"
        text-color="rgba(255,255,255,0.75)"
        active-text-color="#fff"
        router
        unique-opened
      >
        <template v-for="(route, idx) in menuRoutes" :key="route.path">
          <el-sub-menu v-if="route.children && route.children.length > 1" :index="String(idx)">
            <template #title>
              <el-icon><component :is="route.meta.icon" /></el-icon>
              <span>{{ route.meta.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="resolvePath(route.path, child.path)"
            >
              <el-icon><component :is="child.meta.icon || 'Menu'" /></el-icon>
              <template #title>{{ child.meta.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else-if="route.children && route.children.length === 1"
            :index="resolvePath(route.path, route.children[0].path)"
          >
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <template #title>{{ route.children[0].meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>

    <div class="sidebar-footer" v-show="!collapse">
      <div class="sys-tag">政务专属系统</div>
      <div class="version">v2.1.0 · 2025</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{ collapse: boolean }>()
const route = useRoute()

const menuRoutes = computed(() => {
  return [
    { path: '/', meta: { title: '数据大屏', icon: 'DataAnalysis' }, children: [{ path: 'dashboard', meta: { title: '运营数据大屏', icon: 'DataAnalysis' } }] },
    { path: '/citizens', meta: { title: '市民画像', icon: 'User' }, children: [
      { path: 'list', meta: { title: '画像管理', icon: 'Avatar' } },
      { path: 'tags', meta: { title: '标签体系', icon: 'PriceTag' } },
      { path: 'behavior', meta: { title: '行为分析', icon: 'Histogram' } }
    ]},
    { path: '/services', meta: { title: '服务管理', icon: 'Service' }, children: [
      { path: 'list', meta: { title: '办事服务', icon: 'Files' } },
      { path: 'orchestration', meta: { title: '一件事编排', icon: 'Connection' } },
      { path: 'departments', meta: { title: '委办局接入', icon: 'OfficeBuilding' } }
    ]},
    { path: '/knowledge', meta: { title: '知识图谱', icon: 'Reading' }, children: [
      { path: 'policies', meta: { title: '政策管理', icon: 'Document' } },
      { path: 'qa', meta: { title: '问答库', icon: 'ChatDotRound' } },
      { path: 'graph', meta: { title: '图谱可视化', icon: 'Share' } }
    ]},
    { path: '/feedback', meta: { title: '反馈闭环', icon: 'ChatLineSquare' }, children: [
      { path: 'workorders', meta: { title: '督办工单', icon: 'Tickets' } },
      { path: 'clusters', meta: { title: '聚类分析', icon: 'TrendCharts' } },
      { path: 'analytics', meta: { title: '满意度分析', icon: 'PieChart' } }
    ]},
    { path: '/offline', meta: { title: '离线管理', icon: 'Download' }, children: [
      { path: 'packages', meta: { title: '离线包管理', icon: 'Box' } },
      { path: 'certs', meta: { title: '离线证明监控', icon: 'Stamp' } }
    ]},
    { path: '/system', meta: { title: '系统管理', icon: 'Setting' }, children: [
      { path: 'logs', meta: { title: '日志审计', icon: 'DocumentCopy' } },
      { path: 'health', meta: { title: '健康监控', icon: 'Monitor' } }
    ]}
  ]
})

const activeMenu = computed(() => route.path)
const resolvePath = (parent: string, child: string) =>
  parent === '/' ? `/${child}` : `${parent}/${child}`
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.sidebar-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
  gap: 10px;

  .logo-icon { width: 32px; height: 32px; flex-shrink: 0; }
  .logo-text {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.3;
    letter-spacing: 0.5px;
  }
}

.menu-scroll {
  flex: 1;
  overflow-x: hidden;
  margin-top: 8px;

  :deep(.el-menu) {
    border: none;

    .el-menu-item, .el-sub-menu__title {
      height: 48px;
      line-height: 48px;
      margin: 4px 10px;
      border-radius: 6px;
      color: rgba(255,255,255,0.75);

      &:hover { background: rgba(255,255,255,0.12); color: #fff; }
      &.is-active { background: rgba(255,255,255,0.22); color: #fff; }
    }

    .el-sub-menu .el-menu-item { margin: 2px 0; padding-left: 50px !important; font-size: 13px; }
  }
}

.sidebar-footer {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: 12px 16px;
  text-align: center;

  .sys-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 10px;
    background: rgba(255,255,255,0.15);
    color: #fff;
    border-radius: 10px;
    margin-bottom: 4px;
  }
  .version { color: rgba(255,255,255,0.4); font-size: 10px; }
}
</style>
