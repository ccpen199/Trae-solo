<template>
  <div class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'">
      <div class="sidebar-logo">
        <el-icon v-if="isCollapse" class="logo-icon"><Grid /></el-icon>
        <template v-else>
          <el-icon class="logo-icon"><Grid /></el-icon>
          <span>MES 系统</span>
        </template>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <template #title>实时看板</template>
        </el-menu-item>
        <el-sub-menu index="work-orders">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>工单管理</span>
          </template>
          <el-menu-item index="/work-orders">工单列表</el-menu-item>
          <el-menu-item v-if="canCreateWorkOrder" index="/work-orders/create">创建工单</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/reports">
          <el-icon><Edit /></el-icon>
          <template #title>生产报工</template>
        </el-menu-item>
        <el-sub-menu index="quality">
          <template #title>
            <el-icon><CircleCheck /></el-icon>
            <span>质量检验</span>
          </template>
          <el-menu-item index="/quality">检验记录</el-menu-item>
          <el-menu-item v-if="canCreateInspection" index="/quality/create">创建检验</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="abnormal">
          <template #title>
            <el-icon><Warning /></el-icon>
            <span>异常管理</span>
          </template>
          <el-menu-item index="/abnormals">异常列表</el-menu-item>
          <el-menu-item index="/abnormals/create">上报异常</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/yield-analysis">
          <el-icon><TrendCharts /></el-icon>
          <template #title>良率分析</template>
        </el-menu-item>
        <el-sub-menu v-if="isManager" index="logs">
          <template #title>
            <el-icon><List /></el-icon>
            <span>数据追溯</span>
          </template>
          <el-menu-item index="/operation-logs">操作日志</el-menu-item>
          <el-menu-item index="/production-history">生产履历</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div style="display: flex; align-items: center;">
          <el-icon
            class="collapse-icon"
            @click="toggleCollapse"
            :size="20"
            style="cursor: pointer; margin-right: 16px;"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute?.meta?.title">{{
              currentRoute.meta.title
            }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="36" style="background-color: #409eff; color: #fff;">
                {{ userName?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <span style="font-size: 12px; color: #909399;">
                    角色：{{ userRoleLabel }}
                  </span>
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <el-icon style="margin-right: 8px;"><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store';
import { UserRole, UserRoleLabels } from '@/types';
import {
  Grid,
  DataLine,
  Document,
  Edit,
  CircleCheck,
  Warning,
  TrendCharts,
  List,
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isCollapse = ref(false);

const currentRoute = computed(() => route);
const activeMenu = computed(() => route.path);
const userName = computed(() => userStore.userName);
const userRoleLabel = computed(() => userStore.userRole ? UserRoleLabels[userStore.userRole] : '');
const canCreateWorkOrder = computed(() => userStore.hasRole(UserRole.PLANNER));
const canCreateInspection = computed(() =>
  userStore.hasRole([UserRole.QUALITY_INSPECTOR, UserRole.MANAGER])
);
const isManager = computed(() => userStore.hasRole(UserRole.MANAGER));

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  }
};
</script>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3a4a;
}

.logo-icon {
  margin-right: 10px;
  font-size: 24px;
}

.el-aside {
  background-color: #304156;
  overflow: hidden;
}

.el-menu {
  border-right: none;
}

.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.collapse-icon {
  transition: transform 0.3s;
}

.collapse-icon:hover {
  color: #409eff;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  height: 100%;
}

.user-dropdown:hover {
  color: #409eff;
}

.user-name {
  margin-right: 8px;
  color: #606266;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
