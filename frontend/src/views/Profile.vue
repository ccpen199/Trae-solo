<template>
  <div class="profile-page page-container">
    <div class="profile-header">
      <div class="user-avatar">{{ userStore.userInfo?.real_name?.[0] || '用' }}</div>
      <div class="user-info">
        <div class="user-name">
          {{ userStore.userInfo?.real_name || '用户' }}
          <van-tag v-if="userStore.authLevel >= 2" type="success" size="small">已实人认证</van-tag>
        </div>
        <div class="user-phone">{{ userStore.userInfo?.phone || '未绑定手机' }}</div>
        <div class="user-region" @click="showProvincePicker = true">
          <van-icon name="location-o" size="12" />
          {{ userStore.userInfo?.province || '选择属地' }}
          <van-icon name="arrow" size="12" />
        </div>
      </div>
      <div class="logout-btn" @click="doLogout">
        <van-icon name="setting-o" size="22" />
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item" @click="router.push('/profile/records')">
        <div class="stat-num">{{ profileInfo.service_count || 0 }}</div>
        <div class="stat-label">服务记录</div>
      </div>
      <div class="stat-item" @click="router.push('/profile/notifications')">
        <div class="stat-num">{{ profileInfo.unread_notifications || 0 }}</div>
        <div class="stat-label">未读消息</div>
      </div>
      <div class="stat-item" @click="router.push('/profile/archives')">
        <div class="stat-num">{{ archiveCount }}</div>
        <div class="stat-label">我的档案</div>
      </div>
    </div>

    <div class="menu-section">
      <div class="section-title">我的服务</div>
      <van-cell-group inset>
        <van-cell title="服务记录" is-link @click="router.push('/profile/records')">
          <template #icon><van-icon name="orders-o" /></template>
          <template #right-icon><van-icon name="arrow" /></template>
        </van-cell>
        <van-cell title="我的档案" is-link @click="router.push('/profile/archives')">
          <template #icon><van-icon name="folder-o" /></template>
          <template #right-icon><van-icon name="arrow" /></template>
        </van-cell>
        <van-cell title="消息中心" is-link @click="router.push('/profile/notifications')">
          <template #icon><van-icon name="bell-o" /></template>
          <template #right-icon>
            <van-badge v-if="profileInfo.unread_notifications > 0" :content="profileInfo.unread_notifications" :max="99" />
            <van-icon name="arrow" />
          </template>
        </van-cell>
        <van-cell title="授权管理" is-link @click="router.push('/profile/authorizations')">
          <template #icon><van-icon name="shield-o" /></template>
          <template #right-icon><van-icon name="arrow" /></template>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="menu-section">
      <div class="section-title">安全中心</div>
      <van-cell-group inset>
        <van-cell title="操作审计" is-link @click="router.push('/profile/audit')">
          <template #icon><van-icon name="description-o" /></template>
          <template #right-icon><van-icon name="arrow" /></template>
        </van-cell>
        <van-cell title="实人认证">
          <template #icon><van-icon name="certificate" /></template>
          <template #right-icon>
            <span :class="userStore.authLevel >= 2 ? 'text-success' : 'text-danger'">
              {{ userStore.authLevel >= 2 ? '已认证' : '未认证' }}
            </span>
          </template>
        </van-cell>
        <van-cell title="修改密码">
          <template #icon><van-icon name="lock" /></template>
          <template #right-icon><van-icon name="arrow" /></template>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="menu-section">
      <div class="section-title">服务设置</div>
      <van-cell-group inset>
        <van-cell title="消息推送设置">
          <template #icon><van-icon name="bell-o" /></template>
          <template #right-icon>
            <van-switch v-model="pushEnabled" size="20" />
          </template>
        </van-cell>
        <van-cell title="关于我们">
          <template #icon><van-icon name="info-o" /></template>
          <template #right-icon>v1.0.0</template>
        </van-cell>
      </van-cell-group>
    </div>

    <van-action-sheet v-model:show="showLogout" title="确定要退出登录吗？" :actions="actions" cancel-text="取消" @select="onActionSelect" />

    <van-popup v-model:show="showProvincePicker" position="bottom" :style="{ height: '50%' }">
      <van-picker
        :columns="provinceColumns"
        @confirm="onProvinceConfirm"
        title="选择属地"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast } from 'vant';
import { useUserStore } from '@/store/user';
import { getProfileInfo, getArchives } from '@/api/profile';
import { getProvinces, setProvince } from '@/api/home';

const router = useRouter();
const userStore = useUserStore();

const profileInfo = ref({ service_count: 0, unread_notifications: 0 });
const archiveCount = ref(0);
const showLogout = ref(false);
const showProvincePicker = ref(false);
const pushEnabled = ref(true);
const provinces = ref([]);

const actions = [
  { name: '退出登录', color: '#ee0a24' },
];

const provinceColumns = ref([]);

const onActionSelect = (action) => {
  if (action.name === '退出登录') {
    doLogout();
  }
};

const doLogout = async () => {
  showLogout.value = false;
  await userStore.logout();
  showSuccessToast('已退出登录');
  router.replace('/login');
};

const onProvinceConfirm = async ({ selectedOptions }) => {
  const province = selectedOptions[0].text;
  const res = await setProvince(province, province);
  if (res.code === 200) {
    userStore.updateUserInfo({ province, city: province });
    showToast('属地设置成功');
    showProvincePicker.value = false;
  }
};

const loadData = async () => {
  const [profileRes, archiveRes, provinceRes] = await Promise.all([
    getProfileInfo(),
    getArchives({ pageSize: 1 }),
    getProvinces(),
  ]);
  
  if (profileRes.code === 200) profileInfo.value = profileRes.data;
  if (archiveRes.code === 200) archiveCount.value = archiveRes.data.total;
  if (provinceRes.code === 200) {
    provinces.value = provinceRes.data;
    provinceColumns.value = provinces.value.map(p => ({ text: p.name, value: p.code }));
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.profile-page {
  background-color: #f7f8fa;
}

.profile-header {
  background: linear-gradient(135deg, #1989fa 0%, #007dff 100%);
  padding: 40px 20px 60px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
  position: relative;
}

.user-avatar {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-phone {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.user-region {
  font-size: 12px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.logout-btn {
  padding: 8px;
}

.stats-row {
  display: flex;
  margin: -30px 16px 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.stat-item {
  flex: 1;
  text-align: center;
  border-right: 1px solid #ebedf0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-num {
  font-size: 24px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.menu-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  color: #969799;
  padding: 12px 16px 8px;
}

.text-success {
  color: #07c160;
  font-size: 13px;
}

.text-danger {
  color: #ee0a24;
  font-size: 13px;
}
</style>
