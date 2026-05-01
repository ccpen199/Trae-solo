<template>
  <div class="materials-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="referral-card">
          <div class="referral-content">
            <div class="referral-info">
              <h3>我的推荐码</h3>
              <div class="referral-code">{{ referralCode }}</div>
              <el-button type="primary" @click="copyReferralCode">
                <el-icon><CopyDocument /></el-icon>
                复制推荐码
              </el-button>
            </div>
            <div class="referral-qrcode">
              <div class="qrcode-placeholder">
                <el-icon><QrCode /></el-icon>
                <span>二维码占位</span>
              </div>
              <div class="qrcode-tip">扫码即可注册成为下级</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>推广素材</span>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="图片素材" name="image">
          <el-row :gutter="20">
            <el-col :span="8" v-for="material in imageMaterials" :key="material.id">
              <el-card class="material-card">
                <div class="material-cover">
                  <div class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                    <span>{{ material.name }}</span>
                  </div>
                </div>
                <div class="material-info">
                  <h4>{{ material.name }}</h4>
                  <div class="material-stats">
                    <span>浏览: {{ material.viewCount }}</span>
                    <span>点击: {{ material.clickCount }}</span>
                  </div>
                </div>
                <div class="material-actions">
                  <el-button type="primary" size="small" link>获取素材</el-button>
                  <el-button type="primary" size="small" link>生成海报</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="视频素材" name="video">
          <el-empty description="暂无视频素材" />
        </el-tab-pane>

        <el-tab-pane label="分享链接" name="link">
          <el-table :data="linkMaterials" style="width: 100%">
            <el-table-column prop="name" label="素材名称" />
            <el-table-column prop="content" label="链接地址">
              <template #default="{ row }">
                <el-input :value="row.content" readonly style="width: 400px" />
              </template>
            </el-table-column>
            <el-table-column prop="viewCount" label="浏览量" width="100" />
            <el-table-column prop="clickCount" label="点击量" width="100" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="copyLink(row.content)">复制链接</el-button>
                <el-button type="primary" link size="small">生成海报</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  CopyDocument,
  QrCode,
  Picture,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const activeTab = ref('image')

const referralCode = computed(() => userStore.user?.referralCode || '')

const imageMaterials = ref([
  {
    id: 1,
    name: '护肤套装海报',
    viewCount: 128,
    clickCount: 32,
  },
  {
    id: 2,
    name: '智能手表宣传图',
    viewCount: 86,
    clickCount: 18,
  },
  {
    id: 3,
    name: '茶叶礼盒分享图',
    viewCount: 256,
    clickCount: 64,
  },
])

const linkMaterials = ref([
  {
    id: 1,
    name: '首页分享链接',
    content: '/?ref=' + (userStore.user?.referralCode || ''),
    viewCount: 512,
    clickCount: 128,
  },
  {
    id: 2,
    name: '护肤套装详情页',
    content: '/products/1?ref=' + (userStore.user?.referralCode || ''),
    viewCount: 256,
    clickCount: 64,
  },
])

function copyReferralCode() {
  if (referralCode.value) {
    navigator.clipboard.writeText(referralCode.value)
    ElMessage.success('推荐码已复制')
  }
}

function copyLink(link: string) {
  const fullLink = window.location.origin + link
  navigator.clipboard.writeText(fullLink)
  ElMessage.success('链接已复制')
}

onMounted(() => {
  userStore.fetchProfile()
})
</script>

<style scoped>
.materials-container {
  padding: 20px;
}

.referral-card {
  margin-bottom: 20px;
}

.referral-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.referral-info h3 {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 16px;
}

.referral-code {
  font-size: 36px;
  font-weight: 600;
  color: #409eff;
  letter-spacing: 8px;
  margin-bottom: 16px;
}

.referral-qrcode {
  text-align: center;
}

.qrcode-placeholder {
  width: 150px;
  height: 150px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  margin-bottom: 8px;
}

.qrcode-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.qrcode-tip {
  font-size: 12px;
  color: #909399;
}

.material-card {
  margin-bottom: 20px;
}

.material-cover {
  height: 180px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #c0c4cc;
}

.cover-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.material-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.material-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.material-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
</style>
