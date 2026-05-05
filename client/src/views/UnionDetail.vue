<template>
  <div class="container">
    <div v-if="union" class="union-detail-header">
      <div class="union-detail-header-top">
        <div class="union-detail-avatar">{{ union.name.charAt(0) }}</div>
        <div class="union-detail-info">
          <div class="union-detail-name">
            {{ union.name }}
            <span class="badge badge-primary" v-if="union.isRecommend">推荐</span>
            <span class="badge badge-warning">Lv.{{ union.level }} {{ levelConfig?.name }}</span>
          </div>
          <div class="union-detail-desc">{{ union.description || '暂无描述' }}</div>
          <div class="union-detail-stats">
            <div class="detail-stat-item">
              <div class="detail-stat-value">{{ union.reputation }}</div>
              <div class="detail-stat-label">声望</div>
            </div>
            <div class="detail-stat-item">
              <div class="detail-stat-value">{{ union.memberCount }}/{{ union.maxMembers }}</div>
              <div class="detail-stat-label">成员</div>
            </div>
            <div class="detail-stat-item">
              <div class="detail-stat-value">{{ union.level }}</div>
              <div class="detail-stat-label">等级</div>
            </div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <template v-if="isLoggedIn">
            <template v-if="!isMember">
              <button class="btn btn-primary" @click="handleJoin" :disabled="loading">
                {{ loading ? '加入中...' : '加入联盟' }}
              </button>
            </template>
            <template v-else>
              <div class="role-badge" :class="roleClass">
                {{ roleLabel }}
              </div>
              <button v-if="myMember?.role !== 1" class="btn btn-secondary" @click="handleLeave" :disabled="loading">
                {{ loading ? '退出中...' : '退出联盟' }}
              </button>
              <template v-else>
                <div style="font-size: 12px; color: #999; text-align: center;">
                  盟主不能直接退出
                </div>
              </template>
            </template>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-primary">请先登录</router-link>
          </template>
        </div>
      </div>
      <div v-if="levelConfig" class="level-progress">
        <div class="level-info">
          <div class="level-name">{{ levelConfig.name }}</div>
          <div class="level-range">{{ levelConfig.minReputation }} - {{ levelConfig.maxReputation }} 声望</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">
          {{ union.reputation }} / {{ levelConfig.maxReputation }}
        </div>
      </div>
    </div>

    <div v-if="union" class="grid-2">
      <!-- 成员列表 -->
      <div class="section">
        <div class="section-title">
          <span>成员列表</span>
          <span class="section-line"></span>
        </div>
        <div class="card">
          <div v-for="member in members.list" :key="member.id" class="member-item">
            <div class="member-avatar">{{ member.user?.nickname?.charAt(0) || 'U' }}</div>
            <div class="member-info">
              <div class="member-name">
                {{ member.user?.nickname || member.user?.username }}
                <span class="role-badge" :class="getRoleClass(member.role)" style="margin-left: 8px;">
                  {{ getRoleLabel(member.role) }}
                </span>
              </div>
              <div class="member-meta">
                <span>贡献: {{ member.contribution }}</span>
                <span>加入: {{ formatDate(member.joinAt) }}</span>
              </div>
            </div>
            <template v-if="myMember?.role === 1">
              <button
                v-if="member.role !== 1"
                class="btn btn-secondary"
                style="padding: 6px 12px; font-size: 12px;"
                @click="handleSetVice(member.userId, member.role !== 2)"
              >
                {{ member.role === 2 ? '取消副盟主' : '设为副盟主' }}
              </button>
              <button
                v-if="member.role !== 1"
                class="btn btn-danger"
                style="padding: 6px 12px; font-size: 12px; margin-left: 8px;"
                @click="handleKick(member.userId, member.user?.nickname || member.user?.username)"
              >
                开除
              </button>
              <button
                v-if="member.role !== 1"
                class="btn btn-primary"
                style="padding: 6px 12px; font-size: 12px; margin-left: 8px;"
                @click="handleTransfer(member.userId, member.user?.nickname || member.user?.username)"
              >
                移交盟主
              </button>
            </template>
          </div>
          <div v-if="members.list.length === 0" class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p>暂无成员</p>
          </div>
        </div>
      </div>

      <!-- 贡献排行榜 -->
      <div class="section">
        <div class="section-title">
          <span>贡献排行榜</span>
          <span class="section-line"></span>
        </div>
        <div class="card">
          <div v-for="member in contributionRanking.list" :key="member.id" class="rank-item">
            <div
              class="rank-number"
              :class="{
                'rank-1': member.rank === 1,
                'rank-2': member.rank === 2,
                'rank-3': member.rank === 3,
                'rank-default': member.rank > 3,
              }"
            >
              {{ member.rank }}
            </div>
            <div class="member-avatar">{{ member.user?.nickname?.charAt(0) || 'U' }}</div>
            <div class="member-info">
              <div class="member-name">
                {{ member.user?.nickname || member.user?.username }}
                <span class="role-badge" :class="getRoleClass(member.role)" style="margin-left: 8px;">
                  {{ getRoleLabel(member.role) }}
                </span>
              </div>
            </div>
            <div style="font-weight: 700; color: #667eea;">
              {{ member.contribution }}
            </div>
          </div>
          <div v-if="contributionRanking.list.length === 0" class="empty-state">
            <div class="empty-state-icon">🏆</div>
            <p>暂无贡献数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import { useUserStore } from '@/stores/user';
import type { Union, UnionMember, PaginatedResponse, LevelConfig } from '@/types';

const route = useRoute();
const userStore = useUserStore();

const union = ref<Union | null>(null);
const members = ref<PaginatedResponse<UnionMember>>({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
});
const contributionRanking = ref<PaginatedResponse<UnionMember & { rank: number }>>({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
});
const loading = ref(false);

const isLoggedIn = computed(() => userStore.isLoggedIn);
const isMember = computed(() => !!union.value?.currentMember);
const myMember = computed(() => union.value?.currentMember);

const levelConfig = computed(() => {
  if (!union.value?.levelConfig) return null;
  return union.value.levelConfig as LevelConfig;
});

const progressPercent = computed(() => {
  if (!levelConfig.value) return 0;
  const { minReputation, maxReputation } = levelConfig.value;
  const current = (union.value?.reputation || 0) - minReputation;
  const total = maxReputation - minReputation;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
});

const roleClass = computed(() => {
  if (!myMember.value) return 'role-normal';
  if (myMember.value.role === 1) return 'role-leader';
  if (myMember.value.role === 2) return 'role-vice';
  return 'role-normal';
});

const roleLabel = computed(() => getRoleLabel(myMember.value?.role || 3));

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

const fetchData = async () => {
  const unionId = route.params.id as string;
  if (!unionId) return;

  try {
    union.value = await api.getUnionDetail(unionId);
    
    const [membersData, rankingData] = await Promise.all([
      api.getUnionMembers(unionId, { page: 1, pageSize: 10 }),
      api.getContributionRanking(unionId, 1, 10),
    ]);
    
    members.value = membersData;
    contributionRanking.value = rankingData;
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

const handleJoin = async () => {
  const unionId = route.params.id as string;
  if (!unionId || !isLoggedIn.value) return;

  loading.value = true;
  try {
    await api.joinUnion(unionId);
    alert('加入成功！');
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || '加入失败');
  } finally {
    loading.value = false;
  }
};

const handleLeave = async () => {
  const unionId = route.params.id as string;
  if (!unionId || !isMember.value) return;

  if (!confirm('确定要退出该联盟吗？退出后贡献将被清空。')) return;

  loading.value = true;
  try {
    await api.leaveUnion(unionId);
    alert('退出成功！');
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || '退出失败');
  } finally {
    loading.value = false;
  }
};

const handleKick = async (userId: string, nickname: string) => {
  const unionId = route.params.id as string;
  if (!unionId) return;

  if (!confirm(`确定要将 ${nickname} 开除出联盟吗？`)) return;

  try {
    await api.kickMember(unionId, userId);
    alert('开除成功！');
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || '操作失败');
  }
};

const handleSetVice = async (userId: string, isVice: boolean) => {
  const unionId = route.params.id as string;
  if (!unionId) return;

  try {
    await api.setViceLeader(unionId, userId, isVice);
    alert(isVice ? '设置副盟主成功！' : '取消副盟主成功！');
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || '操作失败');
  }
};

const handleTransfer = async (userId: string, nickname: string) => {
  const unionId = route.params.id as string;
  if (!unionId) return;

  if (!confirm(`确定要将盟主移交给 ${nickname} 吗？移交后您将成为普通成员。`)) return;

  try {
    await api.transferLeader(unionId, userId);
    alert('移交成功！');
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || '操作失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>
