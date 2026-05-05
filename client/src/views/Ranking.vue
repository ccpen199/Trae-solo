<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">联盟排行榜</h1>
    </div>

    <div class="tabs">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'reputation' }"
        @click="activeTab = 'reputation'"
      >
        声望榜
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'member' }"
        @click="activeTab = 'member'"
      >
        人数榜
      </div>
    </div>

    <div class="card">
      <div v-for="item in ranking.list" :key="item.id" class="rank-item" @click="goToUnion(item.id)">
        <div
          class="rank-number"
          :class="{
            'rank-1': item.rank === 1,
            'rank-2': item.rank === 2,
            'rank-3': item.rank === 3,
            'rank-default': item.rank > 3,
          }"
        >
          {{ item.rank }}
        </div>
        <div class="union-avatar">{{ item.name.charAt(0) }}</div>
        <div class="union-info" style="flex: 1;">
          <div class="union-name">
            {{ item.name }}
            <span class="badge badge-warning" style="margin-left: 8px;">Lv.{{ item.level }}</span>
            <span class="badge badge-success" v-if="item.reputation > 10000" style="margin-left: 8px;">热门</span>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: #667eea; font-size: 18px;">
            {{ activeTab === 'reputation' ? item.reputation : item.memberCount }}
          </div>
          <div style="font-size: 12px; color: #999;">
            {{ activeTab === 'reputation' ? '声望' : '成员' }}
          </div>
        </div>
      </div>

      <div v-if="ranking.list.length === 0" class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <p>暂无排行数据</p>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="ranking.totalPages > 1">
      <button
        class="pagination-item"
        :disabled="ranking.page <= 1"
        @click="changePage(ranking.page - 1)"
      >
        &lt;
      </button>
      <button
        v-for="page in visiblePages"
        :key="page"
        class="pagination-item"
        :class="{ active: page === ranking.page }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
      <button
        class="pagination-item"
        :disabled="ranking.page >= ranking.totalPages"
        @click="changePage(ranking.page + 1)"
      >
        &gt;
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import router from '@/router';
import { api } from '@/api';
import type { PaginatedResponse, RankItem } from '@/types';

const activeTab = ref<'reputation' | 'member'>('reputation');
const ranking = ref<PaginatedResponse<RankItem>>({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
});

const visiblePages = computed(() => {
  const total = ranking.value.totalPages;
  const current = ranking.value.page;
  const pages: number[] = [];
  
  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);
  
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(5, total);
    } else {
      start = Math.max(1, total - 4);
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const goToUnion = (id: string) => {
  router.push(`/union/${id}`);
};

const fetchData = async () => {
  try {
    const result = await api.getUnionRanking(activeTab.value, ranking.value.page, ranking.value.pageSize);
    ranking.value = result;
  } catch (error) {
    console.error('获取排行榜失败:', error);
  }
};

const changePage = (page: number) => {
  ranking.value.page = page;
  fetchData();
};

watch(activeTab, () => {
  ranking.value.page = 1;
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>
