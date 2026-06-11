<template>
  <div class="records-page page-container">
    <van-nav-bar
      title="服务记录"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <van-tabs v-model:active="activeStatus">
      <van-tab title="全部" name="" />
      <van-tab title="待审核" name="pending" />
      <van-tab title="已完成" name="completed" />
      <van-tab title="已驳回" name="reject" />
    </van-tabs>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
      <div v-for="item in records" :key="item.id" class="record-item">
        <div class="record-header">
          <div class="record-name">{{ item.service_name }}</div>
          <van-tag :class="getStatusClass(item.status)" size="medium">
            {{ getStatusText(item.status) }}
          </van-tag>
        </div>
        <div class="record-body">
          <div class="record-info">
            <div class="info-row">
              <span class="label">受理编号</span>
              <span class="value">{{ item.trace_id }}</span>
            </div>
            <div class="info-row">
              <span class="label">提交时间</span>
              <span class="value">{{ item.created_at }}</span>
            </div>
            <div class="info-row">
              <span class="label">所属属地</span>
              <span class="value">{{ item.province }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-list>

    <div v-if="records.length === 0 && !loading" class="empty-state">
      <van-icon name="orders-o" size="48" />
      <div>暂无服务记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getServiceRecords } from '@/api/services';

const router = useRouter();
const records = ref([]);
const activeStatus = ref('');
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const finished = ref(false);

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    completed: '已完成',
    reject: '已驳回',
  };
  return map[status] || status;
};

const getStatusClass = (status) => {
  const map = {
    pending: 'status-pending',
    completed: 'status-success',
    reject: 'status-reject',
  };
  return map[status] || '';
};

const loadMore = async () => {
  const res = await getServiceRecords({
    page: page.value,
    pageSize,
    status: activeStatus.value || undefined,
  });
  if (res.code === 200) {
    records.value = [...records.value, ...res.data.list];
    page.value++;
    if (res.data.list.length < pageSize) {
      finished.value = true;
    }
  }
  loading.value = false;
};

watch(activeStatus, () => {
  records.value = [];
  page.value = 1;
  finished.value = false;
  loadMore();
});

onMounted(() => {
  loadMore();
});
</script>

<style scoped>
.records-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.record-item {
  background: #fff;
  margin-bottom: 8px;
  padding: 16px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebedf0;
}

.record-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.record-body {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.info-row .label {
  color: #969799;
}

.info-row .value {
  color: #323233;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pending {
  background: #fff7e6 !important;
  color: #ff976a !important;
}

.status-success {
  background: #e8f5e9 !important;
  color: #07c160 !important;
}

.status-reject {
  background: #ffedee !important;
  color: #ee0a24 !important;
}
</style>
