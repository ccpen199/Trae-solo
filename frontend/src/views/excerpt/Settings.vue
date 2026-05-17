<template>
  <div class="page-container">
    <van-nav-bar title="摘录设置" left-arrow @click-left="goBack" />
    <div class="page-content settings-content" v-loading="loading">
      <div class="settings-section">
        <div class="section-title">选择诗词分类</div>
        <div class="category-list">
          <van-checkbox-group v-model="selectedCategories" direction="horizontal">
            <van-checkbox
              v-for="cat in categories"
              :key="cat"
              :name="cat"
              shape="square"
              class="category-item"
            >
              {{ cat }}
            </van-checkbox>
          </van-checkbox-group>
        </div>
      </div>

      <div class="tip" v-if="selectedCategories.length === 0">
        至少选择一个分类
      </div>
    </div>

    <div class="footer-actions">
      <van-button type="default" @click="goBack" block>取消</van-button>
      <van-button type="primary" @click="saveSettings" block :disabled="selectedCategories.length === 0">
        确定
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { poemsApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const categories = ref([])
const selectedCategories = ref([])

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await poemsApi.getCategories()
    categories.value = res.data || []

    if (userStore.isLoggedIn()) {
      const settingsRes = await poemsApi.getExcerptSettings()
      selectedCategories.value = settingsRes.data?.categories || categories.value
    } else {
      selectedCategories.value = categories.value
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const saveSettings = async () => {
  if (!userStore.isLoggedIn()) {
    showToast('登录后可保存设置')
    router.back()
    return
  }

  try {
    await poemsApi.saveExcerptSettings(selectedCategories.value)
    showToast('保存成功')
    router.back()
  } catch (e) {}
}

onMounted(() => {
  loadCategories()
})
</script>

<style lang="less" scoped>
.settings-content {
  padding: 16px;
}

.settings-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.category-list {
  .category-item {
    flex: 0 0 50%;
    margin-bottom: 12px;
  }
}

.tip {
  color: #ff4d4f;
  font-size: 13px;
  padding: 12px 16px;
}

.footer-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
}
</style>
