<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="24" color="#409EFF"><Coffee /></el-icon>
        <span class="logo-text">食品生产管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-sub-menu index="purchase">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>采购管理</span>
          </template>
          <el-menu-item index="/purchase/supplier">供应商管理</el-menu-item>
          <el-menu-item index="/purchase/material">原料管理</el-menu-item>
          <el-menu-item index="/purchase/inbound">原料入库</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="production">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>生产管理</span>
          </template>
          <el-menu-item index="/production/product">产品管理</el-menu-item>
          <el-menu-item index="/production/bom">BOM配方管理</el-menu-item>
          <el-menu-item index="/production/work-order">生产工单</el-menu-item>
          <el-menu-item index="/production/requisition">领料管理</el-menu-item>
          <el-menu-item index="/production/process">工序上报</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="quality">
          <template #title>
            <el-icon><CircleCheck /></el-icon>
            <span>质量管理</span>
          </template>
          <el-menu-item index="/quality/inspection">批次质检</el-menu-item>
          <el-menu-item index="/quality/product-inbound">成品入库</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="warehouse">
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span>仓库管理</span>
          </template>
          <el-menu-item index="/warehouse/inventory">库存台账</el-menu-item>
          <el-menu-item index="/warehouse/shipment">销售发货</el-menu-item>
          <el-menu-item index="/warehouse/batch">批次管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="traceability">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>质量追溯</span>
          </template>
          <el-menu-item index="/traceability/query">批次回溯</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="report">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>报表统计</span>
          </template>
          <el-menu-item index="/report/production">生产报表</el-menu-item>
          <el-menu-item index="/report/inventory">库存报表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user">用户管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="{ path: item.path }"
              >{{ item.title }}</el-breadcrumb-item
            >
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ currentUser?.name || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  ShoppingCart,
  Setting,
  CircleCheck,
  OfficeBuilding,
  Connection,
  DataAnalysis,
  Tools,
  UserFilled,
  ArrowDown,
  Expand,
  Fold,
  Coffee,
} from '@element-plus/icons-vue'

const route = useRoute()

const isCollapse = ref(false)

const currentUser = ref({
  id: '1',
  name: '管理员',
  role: 'ADMIN',
})

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title)
  return matched.slice(1).map((item) => ({
    path: item.path,
    title: item.meta?.title as string,
  }))
})

const handleCommand = (command: string | number | object) => {
  if (command === 'logout') {
    console.log('退出登录')
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 20px;
    background-color: #263445;
    border-bottom: 1px solid #3a4a5b;

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border-right: none;

    .el-sub-menu__title,
    .el-menu-item {
      height: 50px;
      line-height: 50px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    .el-menu-item.is-active {
      background-color: #409eff;
      color: #fff;
    }
  }
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      .user-name {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
