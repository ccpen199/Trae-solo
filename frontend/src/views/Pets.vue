<template>
  <div class="pets-page">
    <van-nav-bar title="我的宠物" left-arrow @click-left="goBack" fixed>
      <template #right>
        <van-icon name="plus" size="20" @click="showAdd = true" />
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-if="pets.length === 0 && !loading" class="empty-state">
          <van-empty description="暂无宠物档案，点击右上角添加" />
        </div>
        <div v-else class="pet-list">
          <div v-for="pet in pets" :key="pet.id" class="pet-item" @click="goDetail(pet.id)">
            <van-image :src="pet.avatar || 'https://picsum.photos/100/100'" round class="pet-avatar" />
            <div class="pet-info">
              <h3 class="pet-name">{{ pet.name }}</h3>
              <div class="pet-meta">
                <span v-if="pet.gender">{{ pet.gender }}</span>
                <span v-if="pet.age"> · {{ pet.age }}岁</span>
                <span v-if="pet.breed"> · {{ pet.breed }}</span>
              </div>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-popup v-model:show="showAdd" position="bottom" round>
      <div class="add-pet-form">
        <h3>添加宠物</h3>
        <van-field v-model="newPet.name" label="宠物名称" placeholder="请输入宠物名称" />
        <van-field v-model="newPet.gender" label="性别" placeholder="请选择性别" is-link readonly clickable />
        <van-field v-model="newPet.age" type="number" label="年龄" placeholder="请输入年龄" />
        <van-field v-model="newPet.breed" label="品种" placeholder="请输入品种" />
        <div class="form-actions">
          <van-button type="default" @click="showAdd = false">取消</van-button>
          <van-button type="primary" @click="addPet">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import type { Pet } from '@/types'

const router = useRouter()

const pets = ref<Pet[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const showAdd = ref(false)
const newPet = ref({
  name: '',
  gender: '',
  age: '',
  breed: ''
})

const fetchPets = async () => {
  try {
    const res = await request.get('/pets', {
      params: { page: page.value, pageSize: 10 }
    })
    if (refreshing.value) {
      pets.value = res.data
      refreshing.value = false
    } else {
      pets.value = [...pets.value, ...res.data]
    }
    finished.value = true
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const onLoad = () => {
  fetchPets()
}

const onRefresh = () => {
  finished.value = false
  page.value = 1
  fetchPets()
}

const goBack = () => {
  router.back()
}

const goDetail = (id: number) => {
  router.push(`/pet/${id}`)
}

const addPet = async () => {
  if (!newPet.value.name.trim()) {
    showToast('请输入宠物名称')
    return
  }
  try {
    await request.post('/pets', {
      name: newPet.value.name,
      gender: newPet.value.gender,
      age: newPet.value.age ? parseInt(newPet.value.age) : undefined,
      breed: newPet.value.breed
    })
    showAdd.value = false
    newPet.value = { name: '', gender: '', age: '', breed: '' }
    showToast('添加成功')
    refreshing.value = true
    onRefresh()
  } catch {}
}

onMounted(() => {
  fetchPets()
})
</script>

<style scoped>
.pets-page {
  padding-top: 46px;
  padding-bottom: 50px;
  min-height: 100vh;
  background: #f5f5f5;
}

.pet-list {
  padding: 10px;
}

.pet-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
}

.pet-avatar {
  width: 60px;
  height: 60px;
  margin-right: 15px;
}

.pet-info {
  flex: 1;
}

.pet-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.pet-meta {
  font-size: 13px;
  color: #999;
}

.empty-state {
  padding: 50px 0;
}

.add-pet-form {
  padding: 20px;
}

.add-pet-form h3 {
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.form-actions .van-button {
  flex: 1;
}
</style>
