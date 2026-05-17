<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const pets = ref([])
const showAddModal = ref(false)
const submitting = ref(false)
const newPet = ref({
  name: '',
  species: '犬',
  breed: '',
  age: '',
  gender: '公',
  sterilized: false,
  registration_number: '',
  weight: '',
  description: ''
})

const speciesOptions = ['犬', '猫', '鸟', '兔', '仓鼠', '其他']
const genderOptions = ['公', '母']

const fetchPets = async () => {
  if (!userStore.isLoggedIn) return
  try {
    loading.value = true
    error.value = ''
    const res = await request.get('/pets')
    pets.value = res.data || []
  } catch (err) {
    console.error('Fetch pets error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handleAddPet = async () => {
  if (!newPet.value.name.trim()) {
    ElMessage.warning('请输入宠物姓名')
    return
  }
  try {
    submitting.value = true
    await request.post('/pets', newPet.value)
    ElMessage.success('添加成功')
    showAddModal.value = false
    resetNewPet()
    fetchPets()
  } catch (err) {
    console.error('Add pet error:', err)
    ElMessage.error('添加失败')
  } finally {
    submitting.value = false
  }
}

const resetNewPet = () => {
  newPet.value = {
    name: '',
    species: '犬',
    breed: '',
    age: '',
    gender: '公',
    sterilized: false,
    registration_number: '',
    weight: '',
    description: ''
  }
}

const handleDeletePet = async (petId) => {
  try {
    await request.delete(`/pets/${petId}`)
    ElMessage.success('删除成功')
    fetchPets()
  } catch (err) {
    console.error('Delete pet error:', err)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchPets()
  }
})
</script>

<template>
  <Layout>
    <div class="pets-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">宠物档案</h1>
          <el-button type="primary" @click="showAddModal = true">
            <el-icon><Plus /></el-icon>
            添加宠物
          </el-button>
        </div>

        <el-skeleton v-if="loading && userStore.isLoggedIn" :rows="4" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchPets">点击重试</el-button>
          </el-empty>
        </div>

        <div v-else-if="!userStore.isLoggedIn" class="empty-state">
          <el-empty description="请先登录查看您的宠物档案">
            <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
          </el-empty>
        </div>

        <div v-else-if="pets.length === 0" class="empty-state">
          <el-empty description="暂无宠物档案，快来添加第一只吧" />
        </div>

        <template v-else>
          <div class="pets-grid">
            <div v-for="pet in pets" :key="pet.id" class="pet-card">
              <div class="pet-avatar">
                <el-avatar :size="80">
                  {{ pet.name?.charAt(0) || '宠' }}
                </el-avatar>
              </div>
              <h3 class="pet-name">{{ pet.name }}</h3>
              <div class="pet-info">
                <p><span>品种：</span>{{ pet.species }} · {{ pet.breed || '未知' }}</p>
                <p><span>年龄：</span>{{ pet.age || '未知' }} 岁</p>
                <p><span>性别：</span>{{ pet.gender }}</p>
                <p><span>绝育：</span>{{ pet.sterilized ? '已绝育' : '未绝育' }}</p>
                <p><span>体重：</span>{{ pet.weight || '未知' }} kg</p>
                <p v-if="pet.registration_number"><span>编号：</span>{{ pet.registration_number }}</p>
              </div>
              <p v-if="pet.description" class="pet-desc">{{ pet.description }}</p>
              <div class="pet-actions">
                <el-button size="small" @click="$router.push(`/health?petId=${pet.id}`)">
                  健康记录
                </el-button>
                <el-button size="small" type="danger" @click="handleDeletePet(pet.id)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <el-dialog v-model="showAddModal" title="添加宠物" width="500px">
      <el-form :model="newPet" label-width="100px">
        <el-form-item label="宠物姓名" required>
          <el-input v-model="newPet.name" placeholder="请输入宠物姓名" />
        </el-form-item>
        <el-form-item label="物种">
          <el-select v-model="newPet.species" style="width: 100%">
            <el-option v-for="s in speciesOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="品种">
          <el-input v-model="newPet.breed" placeholder="请输入品种" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="newPet.age" :min="0" :max="50" style="width: 100%" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="newPet.gender">
            <el-radio v-for="g in genderOptions" :key="g" :label="g">{{ g }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="绝育">
          <el-switch v-model="newPet.sterilized" active-text="已绝育" inactive-text="未绝育" />
        </el-form-item>
        <el-form-item label="体重 (kg)">
          <el-input-number v-model="newPet.weight" :min="0" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="注册编号">
          <el-input v-model="newPet.registration_number" placeholder="请输入编号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newPet.description" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAddPet">确认添加</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<style scoped>
.pets-page {
  min-height: 80vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.pet-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.pet-avatar {
  margin-bottom: 16px;
}

.pet-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.pet-info {
  text-align: left;
  margin-bottom: 12px;
}

.pet-info p {
  color: #606266;
  font-size: 14px;
  margin: 0 0 8px;
}

.pet-info span {
  color: #909399;
}

.pet-desc {
  text-align: left;
  color: #909399;
  font-size: 13px;
  margin: 0 0 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.pet-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.error-state,
.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
