<template>
  <div class="audit-page page-container">
    <van-nav-bar
      title="操作审计"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="audit-tip">
      <van-icon name="info-o" size="16" color="#1989fa" />
      <span>记录您的所有操作，保障账户安全</span>
    </div>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
      <div v-for="item in logs" :key="item.id" class="audit-item">
        <div class="audit-icon">
          <van-icon name="log" size="20" color="#1989fa" />
        </div>
        <div class="audit-content">
          <div class="audit-action">{{ item.module }} - {{ item.action }}</div>
          <div class="audit-meta">
            <span>{{ item.ip }}</span>
            <span>{{ item.created_at }}</span>
          </div>
        </div>
        <van-tag :type="item.status === 200 ? 'success' : 'danger'" size="small">
          {{ item.status === 200 ? '成功' : '失败' }}
        </van-tag>
      </div>
    </van-list>

    <div v-if="logs.length === 0 && !loading" class="empty-state">
      <van-icon name="description-o" size="48" />
      <div>暂无审计记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAuditLogs } from '@/api/profile';

const router = useRouter();
const logs = ref([]);
const page = ref(1);
const pageSize = 20;
const loading = ref(false);
const finished = ref(false);

const loadMore = async () => {
  const res = await getAuditLogs({ page: page.value, pageSize });
  if (res.code === 200) {
    logs.value = [...logs.value, ...res.data.list];
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
.audit-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.audit-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e8f3ff;
  font-size: 13px;
  color: #1989fa;
  margin-bottom: 8px;
}

.audit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  margin-bottom: 1px;
}

.audit-icon {
  width: 40px;
  height: 40px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.audit-content {
  flex: 1;
}

.audit-action {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.audit-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}
</style>
