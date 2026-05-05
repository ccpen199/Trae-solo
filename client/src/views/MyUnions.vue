<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">我的联盟</h1>
      <router-link to="/create-union" class="btn btn-primary">创建联盟</router-link>
    </div>

    <div v-if="myUnions.length > 0">
      <div v-for="union in myUnions" :key="union.id" class="union-card" @click="goToUnion(union.id)">
        <div class="union-card-header">
          <div class="union-avatar">{{ union.name.charAt(0) }}</div>
          <div class="union-info">
            <div class="union-name">
              {{ union.name }}
              <span class="role-badge" :class="getRoleClass(union.role)" style="margin-left: 8px;">
                {{ getRoleLabel(union.role) }}
              </span>
              <span class="badge badge-success" v-if="union.isRecommend" style="margin-left: 8px;">推荐</span>
            </div>
            <div class="union-desc">{{ union.description || '暂无描述' }}</div>
            <div class="union-meta" style="font-size: 12px; color: #999; margin-top: 4px;">
              盟主: {{ union.leader?.nickname || '未知' }}
              &nbsp;|&nbsp;
              我的贡献: {{ union.contribution }}
              &nbsp;|&nbsp;
              加入时间: {{ formatDate(union.joinAt) }}
            </div>
          </div>
        </div>
        <div class="union-stats">
          <div class="stat-item">
            <div class="stat-value">{{ union.reputation }}</div>
            <div class="stat-label">声望</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ union.memberCount }}/{{ union.maxMembers }}</div>
            <div class="stat-label">成员</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">Lv.{{ union.level }}</div>
            <div class="stat-label">等级</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card empty-state">
      <div class="empty-state-icon">🏰</div>
      <p>您还没有加入任何联盟</p>
      <p style="margin-top: 8px; color: #999;">快去广场浏览或创建一个吧！</p>
      <div style="margin-top: 24px;">
        <router-link to="/" class="btn btn-primary" style="margin-right: 12px;">浏览联盟</router-link>
        <router-link to="/create-union" class="btn btn-secondary">创建联盟</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import router from '@/router';
import { api } from '@/api';
import type { Union } from '@/types';

const myUnions = ref<(Union & { role: number; contribution: number; joinAt: string })[]>([]);

function getRoleLabel(role: number): string {
  switch (role) {
    case 1: return '盟主';
    case 2: return '副盟主';
    default: return '成员';
  }
}

function getRoleClass(role: number): string {
  switch (role) {
    case 1: return 'role-leader';
    case 2: return 'role-vice';
    default: return 'role-normal';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const goToUnion = (id: string) => {
  router.push(`/union/${id}`);
};

const fetchData = async () => {
  try {
    const unions = await api.getMyUnions();
    myUnions.value = unions as any;
  } catch (error) {
    console.error('获取我的联盟失败:', error);
  }
};

onMounted(() => {
  fetchData();
});
</script>
