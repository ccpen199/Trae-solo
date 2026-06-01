<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background-color: #2c3e50">
      <div style="padding: 20px; text-align: center; color: #fff; font-size: 18px; font-weight: bold">
        团长管理系统
      </div>
      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical-demo"
        background-color="#2c3e50"
        text-color="#fff"
        active-text-color="#ffd04b"
        router
      >
        <el-menu-item index="/">
          <span>🏠 首页</span>
        </el-menu-item>
        <el-menu-item index="/leaders" v-if="currentRole === 'admin'">
          <span>👥 团长管理</span>
        </el-menu-item>
        <el-menu-item index="/activities">
          <span>🛒 团购活动</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <span>📋 订单管理</span>
        </el-menu-item>
        <el-menu-item index="/commissions" v-if="currentRole !== 'customer'">
          <span>💰 分佣结算</span>
        </el-menu-item>
        <el-menu-item index="/aftersales">
          <span>🔧 售后管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center">
        <span style="color: #606266">
          当前角色：
          <el-tag :type="roleTagType">{{ currentRoleName }}</el-tag>
        </span>
        <el-select v-model="currentRole" @change="onRoleChange" style="width: 150px">
          <el-option label="运营端" value="admin" />
          <el-option label="团长端" value="leader" />
          <el-option label="客户端" value="customer" />
        </el-select>
      </el-header>
      <el-main style="background-color: #f5f7fa">
        <router-view :current-role="currentRole" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const currentRole = ref(localStorage.getItem('currentRole') || 'admin');

const currentRoleName = computed(() => {
  const names = { admin: '运营端', leader: '团长端', customer: '客户端' };
  return names[currentRole.value] || '运营端';
});

const roleTagType = computed(() => {
  const types = { admin: 'danger', leader: 'warning', customer: 'success' };
  return types[currentRole.value] || 'info';
});

const onRoleChange = (role) => {
  localStorage.setItem('currentRole', role);
  ElMessage.success(`已切换到${currentRoleName.value}`);
  router.push('/');
};
</script>

<style>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}
</style>
