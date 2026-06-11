<template>
  <div class="archives-page page-container">
    <van-nav-bar
      title="个人数字档案"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
      <div v-for="item in archives" :key="item.id" class="archive-item">
        <div class="archive-icon">
          <van-icon name="description-o" size="24" />
        </div>
        <div class="archive-info">
          <div class="archive-title">{{ item.title }}</div>
          <div class="archive-type">{{ item.archive_type }}</div>
          <div class="archive-date">{{ item.created_at }}</div>
        </div>
        <van-tag :type="item.encrypted ? 'success' : 'warning'">
          {{ item.encrypted ? '已加密' : '未加密' }}
        </van-tag>
      </div>
    </van-list>

    <div v-if="archives.length === 0 && !loading" class="empty-state">
      <van-icon name="folder-o" size="48" />
      <div>暂无档案信息</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getArchives } from '@/api/profile';

const router = useRouter();
const archives = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const finished = ref(false);

const loadMore = async () => {
  const res = await getArchives({ page: page.value, pageSize });
  if (res.code === 200) {
    archives.value = [...archives.value, ...res.data.list];
    page.value++;
    if (res.data.list.length < pageSize) {
      finished.value = true;
    }
  }
  loading.value = false;
};

onMounted(() => {
  loadMore();
});
</script>

<style scoped>
.archives-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.archive-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  margin-bottom: 8px;
}

.archive-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.archive-info {
  flex: 1;
}

.archive-title {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
}

.archive-type {
  font-size: 12px;
  color: #1989fa;
  margin-bottom: 4px;
}

.archive-date {
  font-size: 12px;
  color: #969799;
}
</style>
