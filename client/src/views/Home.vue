<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">联盟广场</h1>
      <div class="search-box" style="max-width: 400px;">
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索联盟名称..."
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
      </div>
    </div>

    <div class="grid-2">
      <!-- 推荐联盟 -->
      <div class="section">
        <div class="section-title">
          <span>推荐联盟</span>
          <span class="section-line"></span>
        </div>
        <div class="card" v-if="recommendedUnions.length > 0">
          <div v-for="union in recommendedUnions" :key="union.id" class="union-card" @click="goToUnion(union.id)">
            <div class="union-card-header">
              <div class="union-avatar">{{ union.name.charAt(0) }}</div>
              <div class="union-info">
                <div class="union-name">
                  {{ union.name }}
                  <span class="badge badge-success" v-if="union.isRecommend">推荐</span>
                </div>
                <div class="union-desc">{{ union.description || '暂无描述' }}</div>
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
        <div class="card empty-state" v-else>
          <div class="empty-state-icon">🏰</div>
          <p>暂无推荐联盟</p>
        </div>
      </div>

      <!-- 最新联盟 -->
      <div class="section">
        <div class="section-title">
          <span>最新联盟</span>
          <span class="section-line"></span>
        </div>
        <div class="card" v-if="latestUnions.length > 0">
          <div v-for="union in latestUnions" :key="union.id" class="union-card" @click="goToUnion(union.id)">
            <div class="union-card-header">
              <div class="union-avatar">{{ union.name.charAt(0) }}</div>
              <div class="union-info">
                <div class="union-name">{{ union.name }}</div>
                <div class="union-desc">{{ union.description || '暂无描述' }}</div>
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
        <div class="card empty-state" v-else>
          <div class="empty-state-icon">🏰</div>
          <p>暂无联盟</p>
        </div>
      </div>
    </div>

    <!-- 所有联盟列表 -->
    <div class="section">
      <div class="section-title">
        <span>所有联盟</span>
        <span class="section-line"></span>
      </div>
      <div class="card" v-if="unions.list.length > 0">
        <div v-for="union in unions.list" :key="union.id" class="union-card" @click="goToUnion(union.id)">
          <div class="union-card-header">
            <div class="union-avatar">{{ union.name.charAt(0) }}</div>
            <div class="union-info">
              <div class="union-name">
                {{ union.name }}
                <span class="badge badge-success" v-if="union.isRecommend">推荐</span>
              </div>
              <div class="union-desc">{{ union.description || '暂无描述' }}</div>
              <div class="union-meta" style="font-size: 12px; color: #999; margin-top: 4px;">
                盟主: {{ union.leader?.nickname || '未知' }}
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
      <div class="card empty-state" v-else>
        <div class="empty-state-icon">🏰</div>
        <p>暂无联盟，快来创建第一个联盟吧！</p>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="unions.totalPages > 1">
        <button
          class="pagination-item"
          :disabled="unions.page <= 1"
          @click="changePage(unions.page - 1)"
        >
          &lt;
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          class="pagination-item"
          :class="{ active: page === unions.page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
          class="pagination-item"
          :disabled="unions.page >= unions.totalPages"
          @click="changePage(unions.page + 1)"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import router from '@/router';
import { api } from '@/api';
import type { Union, PaginatedResponse } from '@/types';

const searchKeyword = ref('');
const recommendedUnions = ref<Union[]>([]);
const latestUnions = ref<Union[]>([]);
const unions = ref<PaginatedResponse<Union>>({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
});

const visiblePages = computed(() => {
  const total = unions.value.totalPages;
  const current = unions.value.page;
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

const fetchData = async () => {
  try {
    const [recommended, latest, all] = await Promise.all([
      api.getRecommendedUnions(5),
      api.getUnions({
        page: 1,
        pageSize: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
      api.getUnions({
        page: unions.value.page,
        pageSize: 10,
        keyword: searchKeyword.value || undefined,
      }),
    ]);
    
    recommendedUnions.value = recommended;
    latestUnions.value = latest.list;
    unions.value = all;
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

const handleSearch = () => {
  unions.value.page = 1;
  fetchData();
};

const changePage = (page: number) => {
  unions.value.page = page;
  fetchData();
};

const goToUnion = (id: string) => {
  router.push(`/union/${id}`);
};

onMounted(() => {
  fetchData();
});
</script>
