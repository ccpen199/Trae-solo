<template>
  <div class="profile-page page-container">
    <div class="container">
      <el-row :gutter="24">
        <el-col :span="8">
          <el-card class="profile-card">
            <div class="profile-header">
              <el-avatar :size="100" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.charAt(0) }}
              </el-avatar>
              <h2 class="user-name">{{ userStore.user?.nickname }}</h2>
              <p class="user-email">{{ userStore.user?.email }}</p>
              <el-tag v-if="userStore.user?.role === 'admin'" type="danger" size="small">
                管理员
              </el-tag>
            </div>
            
            <el-divider />
            
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ userStore.user?.favoriteCount || 0 }}</span>
                <span class="stat-label">收藏书籍</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStore.user?.followingCount || 0 }}</span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStore.user?.followerCount || 0 }}</span>
                <span class="stat-label">粉丝</span>
              </div>
            </div>
            
            <el-divider />
            
            <el-menu
              :default-active="activeMenu"
              class="profile-menu"
              @select="handleMenuSelect"
            >
              <el-menu-item index="profile">
                <el-icon><User /></el-icon>
                <span>个人信息</span>
              </el-menu-item>
              <el-menu-item index="favorites">
                <el-icon><Star /></el-icon>
                <span>我的收藏</span>
              </el-menu-item>
              <el-menu-item index="password">
                <el-icon><Lock /></el-icon>
                <span>修改密码</span>
              </el-menu-item>
            </el-menu>
          </el-card>
        </el-col>

        <el-col :span="16">
          <div v-if="activeMenu === 'profile'" class="content-card">
            <el-card>
              <template #header>
                <h3>个人信息</h3>
              </template>
              
              <el-form
                :model="profileForm"
                :rules="profileRules"
                ref="profileFormRef"
                label-width="100px"
              >
                <el-form-item label="昵称" prop="nickname">
                  <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profileForm.email" disabled />
                </el-form-item>
                <el-form-item label="个人简介" prop="bio">
                  <el-input
                    v-model="profileForm.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="介绍一下自己..."
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="updateProfile"
                    :loading="loading.profile"
                  >
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>

          <div v-if="activeMenu === 'favorites'" class="content-card">
            <el-card>
              <template #header>
                <h3>我的收藏</h3>
              </template>
              
              <div v-loading="loading.favorites" class="favorites-grid">
                <div
                  v-for="book in favoriteBooks"
                  :key="book.id"
                  class="book-item"
                  @click="goToBook(book)"
                >
                  <el-card shadow="hover">
                    <img :src="book.coverImage" :alt="book.title" class="book-cover" />
                    <h4 class="book-title text-ellipsis">{{ book.title }}</h4>
                    <p class="book-author text-ellipsis">{{ book.author }}</p>
                    <div class="book-stats">
                      <el-rate :model-value="book.rating" disabled size="small" />
                      <span class="rating-text">{{ book.rating }}</span>
                    </div>
                  </el-card>
                </div>
              </div>
              
              <el-empty v-if="!loading.favorites && favoriteBooks.length === 0" description="暂无收藏书籍" />
            </el-card>
          </div>

          <div v-if="activeMenu === 'password'" class="content-card">
            <el-card>
              <template #header>
                <h3>修改密码</h3>
              </template>
              
              <el-form
                :model="passwordForm"
                :rules="passwordRules"
                ref="passwordFormRef"
                label-width="120px"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入原密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="updatePassword"
                    :loading="loading.password"
                  >
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import api from '@/api';
import {
  User,
  Star,
  Lock
} from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

const activeMenu = ref('profile');
const profileFormRef = ref(null);
const passwordFormRef = ref(null);

const loading = reactive({
  profile: false,
  favorites: false,
  password: false
});

const favoriteBooks = ref([]);

const profileForm = reactive({
  nickname: '',
  email: '',
  bio: ''
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const profileRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度为2-20个字符', trigger: 'blur' }
  ]
};

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为6-32个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

const handleMenuSelect = (index) => {
  activeMenu.value = index;
  if (index === 'favorites') {
    fetchFavorites();
  }
};

const loadProfileData = () => {
  profileForm.nickname = userStore.user?.nickname || '';
  profileForm.email = userStore.user?.email || '';
  profileForm.bio = userStore.user?.bio || '';
};

const updateProfile = async () => {
  if (!profileFormRef.value) return;

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.profile = true;
      try {
        const res = await api.put('/auth/profile', {
          nickname: profileForm.nickname,
          bio: profileForm.bio
        });
        userStore.setUser(res.data);
        ElMessage.success('个人信息更新成功');
      } catch (error) {
        console.error('Failed to update profile:', error);
        ElMessage.error(error.response?.data?.message || '更新失败');
      } finally {
        loading.profile = false;
      }
    }
  });
};

const fetchFavorites = async () => {
  loading.favorites = true;
  try {
    const res = await api.get('/auth/favorites');
    favoriteBooks.value = res.data.favorites || [];
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  } finally {
    loading.favorites = false;
  }
};

const updatePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.password = true;
      try {
        await api.put('/auth/password', {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        });
        ElMessage.success('密码修改成功');
        passwordForm.oldPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
      } catch (error) {
        console.error('Failed to update password:', error);
        ElMessage.error(error.response?.data?.message || '密码修改失败');
      } finally {
        loading.password = false;
      }
    }
  });
};

const goToBook = (book) => {
  router.push(`/books/${book.id}`);
};

onMounted(() => {
  loadProfileData();
});
</script>

<style scoped>
.profile-page {
  padding-bottom: 40px;
  padding-top: 24px;
}

.profile-card {
  text-align: center;
}

.profile-header {
  padding: 20px 0;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 12px 0 6px;
}

.user-email {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.profile-menu {
  border-right: none;
}

.content-card {
  margin-bottom: 24px;
}

.content-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 10px 0;
}

.book-item {
  cursor: pointer;
}

.book-cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.book-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.book-author {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.book-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-text {
  font-size: 12px;
  color: #f7ba2a;
  font-weight: 600;
}
</style>
