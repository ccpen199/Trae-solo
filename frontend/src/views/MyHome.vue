<template>
  <div class="my-home-page">
    <van-nav-bar title="我的家" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="plus" size="20" @click="showAddPopup = true" />
      </template>
    </van-nav-bar>
    
    <div class="home-content">
      <van-tabs v-model:active="activeTab">
        <van-tab title="我的空间">
          <van-empty description="暂无空间" v-if="homeList.length === 0">
            <template #description>
              <p>还没有创建空间</p>
            </template>
            <van-button type="primary" round @click="createHome">
              创建我的家
            </van-button>
          </van-empty>
          
          <div class="home-list" v-else>
            <div v-for="item in homeList" :key="item.id" class="home-item">
              <div class="home-image">
                <img :src="item.images?.[0]" alt="空间" v-if="item.images?.length" />
                <div class="home-image-placeholder" v-else>
                  <van-icon name="home-o" size="48" color="#999" />
                </div>
              </div>
              <div class="home-info">
                <h3 class="home-name">{{ item.name }}</h3>
                <p class="home-desc">{{ item.description || '暂无描述' }}</p>
              </div>
            </div>
          </div>
        </van-tab>
        
        <van-tab title="收藏空间">
          <van-empty description="暂无收藏" v-if="favoriteSpaces.length === 0" />
        </van-tab>
      </van-tabs>
    </div>
    
    <van-popup v-model:show="showAddPopup" round position="bottom">
      <div class="add-popup">
        <h3 class="popup-title">创建空间</h3>
        <van-cell-group inset>
          <van-field
            v-model="newHome.name"
            placeholder="请输入空间名称"
            label="空间名称"
          />
          <van-field
            v-model="newHome.description"
            type="textarea"
            placeholder="请输入空间描述"
            label="空间描述"
            :autosize="{ maxHeight: 100 }"
          />
        </van-cell-group>
        <div class="popup-actions">
          <van-button type="default" block @click="showAddPopup = false">取消</van-button>
          <van-button type="primary" block @click="submitCreate">创建</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const activeTab = ref(0)
const homeList = ref([])
const favoriteSpaces = ref([])
const showAddPopup = ref(false)

const newHome = reactive({
  name: '',
  description: ''
})

const goBack = () => {
  router.back()
}

const createHome = () => {
  showAddPopup.value = true
}

const submitCreate = () => {
  if (!newHome.name.trim()) {
    showToast('请输入空间名称')
    return
  }
  
  homeList.value.unshift({
    id: Date.now(),
    name: newHome.name,
    description: newHome.description,
    images: [],
    created_at: new Date().toISOString()
  })
  
  showAddPopup.value = false
  newHome.name = ''
  newHome.description = ''
  showToast('创建成功')
}
</script>

<style scoped>
.my-home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

:deep(.van-tabs__wrap) {
  background: #fff;
}

:deep(.van-tab--active) {
  color: #667eea;
}

:deep(.van-tabs__line) {
  background: #667eea;
}

.home-list {
  padding: 10px;
}

.home-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
}

.home-image {
  width: 100px;
  height: 75px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f8f9fa;
}

.home-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.home-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px;
}

.home-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-popup {
  padding: 20px;
}

.popup-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  text-align: center;
}

.popup-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
}
</style>
