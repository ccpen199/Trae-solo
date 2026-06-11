<template>
  <div class="authorizations-page page-container">
    <van-nav-bar
      title="授权管理"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="auth-tip">
      <van-icon name="info-o" size="16" color="#1989fa" />
      <span>管理您授权的服务，随时可以取消授权</span>
    </div>

    <div v-for="item in authorizations" :key="item.id" class="auth-item">
      <div class="auth-icon">
        <van-icon name="shield-o" size="24" />
      </div>
      <div class="auth-info">
        <div class="auth-name">{{ item.service_type }}</div>
        <div class="auth-date" v-if="item.authorized">
          授权时间：{{ item.authorized_at }}
        </div>
        <div class="auth-date" v-else>未授权</div>
      </div>
      <van-switch
        :model-value="item.authorized === 1"
        size="24"
        @change="toggleAuth(item.id)"
      />
    </div>

    <div v-if="authorizations.length === 0" class="empty-state">
      <van-icon name="shield-o" size="48" />
      <div>暂无授权信息</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccessToast } from 'vant';
import { getAuthorizations, toggleAuthorization } from '@/api/profile';

const router = useRouter();
const authorizations = ref([]);

const toggleAuth = async (id) => {
  const res = await toggleAuthorization(id);
  if (res.code === 200) {
    const item = authorizations.value.find(a => a.id === id);
    if (item) {
      item.authorized = item.authorized === 1 ? 0 : 1;
      if (item.authorized) {
        item.authorized_at = new Date().toISOString();
      }
    }
    showSuccessToast(res.message);
  }
};

const loadData = async () => {
  const res = await getAuthorizations();
  if (res.code === 200) {
    authorizations.value = res.data;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.authorizations-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.auth-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e8f3ff;
  font-size: 13px;
  color: #1989fa;
}

.auth-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  margin-bottom: 8px;
}

.auth-icon {
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

.auth-info {
  flex: 1;
}

.auth-name {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
}

.auth-date {
  font-size: 12px;
  color: #969799;
}
</style>
