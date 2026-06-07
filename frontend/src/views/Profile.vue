<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="avatar-section">
            <el-avatar :size="80" class="avatar">
              {{ userStore.userInfo?.realName?.charAt(0) || userStore.userInfo?.username?.charAt(0) }}
            </el-avatar>
            <div class="user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</div>
            <div class="user-type">
              <el-tag :type="userStore.isAdmin ? 'danger' : 'primary'">
                {{ userTypeText }}
              </el-tag>
            </div>
          </div>
          
          <el-divider />

          <div class="verify-section">
            <div class="section-title">{{ isLegal ? '企业认证状态' : '公安实名核验' }}</div>
            <div v-if="profile.police_verified" class="verified">
              <el-icon :size="20" color="#10b981"><CircleCheckFilled /></el-icon>
              <span>{{ isLegal ? '企业认证已通过' : '已通过公安实名核验' }}</span>
            </div>
            <div v-else class="not-verified">
              <el-icon :size="20" color="#f59e0b"><WarningFilled /></el-icon>
              <span>{{ isLegal ? '未完成企业认证' : '未完成实名核验' }}</span>
              <el-button type="primary" size="small" @click="verifyDialogVisible = true" style="margin-left: 12px;">
                {{ isLegal ? '去认证' : '去核验' }}
              </el-button>
            </div>
          </div>

          <el-divider v-if="isLegal" />

          <div v-if="isLegal" class="verify-section">
            <div class="section-title">电子营业执照</div>
            <div v-if="profile.business_license_hash" class="verified">
              <el-icon :size="20" color="#10b981"><CircleCheckFilled /></el-icon>
              <span>已关联营业执照</span>
              <div class="license-detail">
                <span>统一社会信用代码: {{ profile.credit_code }}</span>
              </div>
            </div>
            <div v-else class="not-verified">
              <el-icon :size="20" color="#f59e0b"><WarningFilled /></el-icon>
              <span>未关联电子营业执照</span>
            </div>
          </div>

          <el-divider />

          <div class="stats-section">
            <div class="stat-item">
              <div class="stat-value">{{ profile.applicationCount || 0 }}</div>
              <div class="stat-label">办件数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ profile.certificateCount || 0 }}</div>
              <div class="stat-label">电子证照</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          <el-form :model="profileForm" label-width="120px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="真实姓名">
              <el-input v-model="profileForm.realName" :placeholder="isLegal ? '企业名称' : '请输入真实姓名'" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="电子邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入电子邮箱" />
            </el-form-item>
            <el-form-item label="身份证号" v-if="!isLegal">
              <el-input v-model="profileForm.idCard" placeholder="请输入身份证号" disabled />
            </el-form-item>
            <el-form-item label="信用代码" v-if="isLegal">
              <el-input v-model="profileForm.creditCode" placeholder="统一社会信用代码" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile" :loading="saving">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>办事画像</span>
          </template>
          <div v-if="portraitData.recentApplications?.length">
            <div class="portrait-tags">
              <el-tag v-for="tag in portraitData.tags" :key="tag" style="margin-right: 8px;">
                {{ tag }}
              </el-tag>
            </div>
            <el-table :data="portraitData.recentApplications" size="small" style="margin-top: 16px;">
              <el-table-column prop="item_name" label="事项名称" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="时间" width="180" />
            </el-table>
          </div>
          <el-empty v-else description="暂无办事记录" :image-size="100" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="verifyDialogVisible" :title="isLegal ? '企业认证' : '公安实名核验'" width="500px">
      <el-form :model="verifyForm" label-width="100px">
        <el-form-item :label="isLegal ? '企业名称' : '真实姓名'">
          <el-input v-model="verifyForm.realName" :placeholder="isLegal ? '请输入企业名称' : '请输入真实姓名'" />
        </el-form-item>
        <el-form-item :label="isLegal ? '信用代码' : '身份证号'">
          <el-input v-model="verifyForm.idCard" :placeholder="isLegal ? '请输入统一社会信用代码' : '请输入18位身份证号'" maxlength="18" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVerify" :loading="verifying">提交核验</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import api from '@/utils/api';

const userStore = useUserStore();
const saving = ref(false);
const verifying = ref(false);
const profile = ref<any>({});
const portraitData = ref<any>({});
const verifyDialogVisible = ref(false);

const isLegal = computed(() => userStore.userType === 'legal');

const profileForm = reactive({
  username: '',
  realName: '',
  phone: '',
  email: '',
  idCard: '',
  creditCode: ''
});

const verifyForm = reactive({
  realName: '',
  idCard: ''
});

const userTypeText = computed(() => {
  const map: Record<string, string> = {
    natural: '自然人用户',
    legal: '法人用户',
    admin: '管理员'
  };
  return map[userStore.userInfo?.userType] || '普通用户';
});

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  };
  return map[status] || status;
};

const loadProfile = async () => {
  try {
    const res = await api.get('/users/profile');
    if (res.code === 200) {
      profile.value = res.data;
      profileForm.username = res.data.username;
      profileForm.realName = res.data.real_name || '';
      profileForm.phone = res.data.phone || '';
      profileForm.email = res.data.email || '';
      profileForm.idCard = res.data.id_card || '';
      profileForm.creditCode = res.data.credit_code || '';
    }
  } catch (error) {
    console.error('加载个人信息失败', error);
  }
};

const loadPortrait = async () => {
  try {
    const res = await api.get('/users/portrait');
    if (res.code === 200) {
      portraitData.value = res.data;
    }
  } catch (error) {
    console.error('加载办事画像失败', error);
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const res = await api.put('/users/profile', {
      realName: profileForm.realName,
      phone: profileForm.phone,
      email: profileForm.email
    });
    if (res.code === 200) {
      ElMessage.success('保存成功');
      loadProfile();
      userStore.fetchProfile();
    }
  } finally {
    saving.value = false;
  }
};

const submitVerify = async () => {
  if (!verifyForm.realName || !verifyForm.idCard) {
    ElMessage.warning(isLegal.value ? '请输入企业名称和信用代码' : '请输入真实姓名和身份证号');
    return;
  }
  verifying.value = true;
  try {
    const res = await api.post('/users/police-verify', verifyForm);
    if (res.code === 200) {
      if (res.data.verified) {
        ElMessage.success(isLegal.value ? '企业认证通过' : '核验通过');
        verifyDialogVisible.value = false;
        loadProfile();
        userStore.fetchProfile();
      } else {
        ElMessage.error(res.message);
      }
    }
  } finally {
    verifying.value = false;
  }
};

onMounted(() => {
  userStore.restoreUserInfo();
  loadProfile();
  loadPortrait();
});
</script>

<style scoped>
.profile-card {
  text-align: center;
}

.avatar-section {
  padding: 20px 0;
}

.avatar {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  font-size: 32px;
  font-weight: 600;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-top: 12px;
  color: #1e293b;
}

.user-type {
  margin-top: 8px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #334155;
}

.verified, .not-verified {
  display: flex;
  align-items: center;
  font-size: 14px;
  flex-wrap: wrap;
}

.verified {
  color: #10b981;
}

.not-verified {
  color: #f59e0b;
}

.license-detail {
  width: 100%;
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  padding-left: 28px;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e40af;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.portrait-tags {
  margin-bottom: 12px;
}
</style>
