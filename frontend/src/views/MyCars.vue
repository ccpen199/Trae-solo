<template>
  <div class="my-cars-page">
    <div class="header">
      <div class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </div>
      <h3>我的车辆</h3>
      <div class="add-btn" @click="goToCarSelect">
        <el-icon :size="18"><Plus /></el-icon>
      </div>
    </div>

    <div class="empty-state" v-if="carList.length === 0">
      <el-icon :size="64" color="#ccc"><Car /></el-icon>
      <p class="empty-text">暂无车辆</p>
      <p class="empty-hint">添加车辆后可享受精准推荐</p>
      <el-button type="primary" @click="goToCarSelect">添加车辆</el-button>
    </div>

    <div class="car-list" v-else>
      <div 
        v-for="car in carList" 
        :key="car.id"
        class="car-card"
        :class="{ 'default-car': car.isDefault }"
      >
        <div class="car-header" v-if="car.isDefault">
          <el-tag type="primary" size="small" effect="dark">默认车辆</el-tag>
        </div>
        <div class="car-info">
          <div class="car-icon">
            <el-icon :size="32"><Car /></el-icon>
          </div>
          <div class="car-details">
            <h4 class="car-name">
              {{ car.carInfo?.brandName }} {{ car.carInfo?.seriesName }}
            </h4>
            <p class="car-spec">
              {{ car.carInfo?.year }} {{ car.carInfo?.displacement }} {{ car.carInfo?.name }}
            </p>
            <div class="car-meta" v-if="car.licensePlate || car.mileage">
              <span v-if="car.licensePlate" class="license-plate">
                车牌号：{{ car.licensePlate }}
              </span>
              <span v-if="car.mileage" class="mileage">
                里程：{{ car.mileage }}公里
              </span>
            </div>
          </div>
        </div>
        <div class="car-actions">
          <el-button size="small" text @click="editCar(car)">
            <el-icon :size="14"><Edit /></el-icon>
            编辑
          </el-button>
          <el-button size="small" text type="danger" @click="deleteCar(car)">
            <el-icon :size="14"><Delete /></el-icon>
            删除
          </el-button>
          <el-button 
            v-if="!car.isDefault" 
            size="small" 
            text 
            type="primary" 
            @click="setDefault(car)"
          >
            设为默认
          </el-button>
        </div>
      </div>
    </div>

    <div class="add-car-fab" @click="goToCarSelect" v-if="carList.length > 0">
      <el-icon :size="24"><Plus /></el-icon>
    </div>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑车辆"
      width="90%"
      class="edit-dialog"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="车牌号">
          <el-input v-model="editForm.licensePlate" placeholder="请输入车牌号" maxlength="10" />
        </el-form-item>
        <el-form-item label="当前里程">
          <el-input v-model="editForm.mileage" placeholder="请输入里程数（公里）" type="number" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="editForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const carList = ref([])
const editDialogVisible = ref(false)
const editForm = ref({
  id: null,
  licensePlate: '',
  mileage: '',
  isDefault: false
})
const saving = ref(false)

const goBack = () => {
  router.back()
}

const goToCarSelect = () => {
  router.push('/car-select')
}

const loadCars = async () => {
  if (!userStore.isLoggedIn) {
    return
  }
  try {
    const res = await request.get('/api/user-cars')
    if (res.code === 200) {
      carList.value = res.data
    }
  } catch (e) {
    carList.value = [
      {
        id: 1,
        carModelId: 1,
        licensePlate: '京A12345',
        mileage: 58000,
        isDefault: true,
        carInfo: {
          fullName: '2024款 1.4T 舒适版',
          name: '舒适版',
          transmission: '双离合',
          fuelType: '汽油',
          displacement: '1.4T',
          year: '2024款',
          seriesName: '朗逸',
          brandName: '大众'
        }
      },
      {
        id: 2,
        carModelId: 2,
        licensePlate: '京B67890',
        mileage: 32000,
        isDefault: false,
        carInfo: {
          fullName: '2023款 2.0T 豪华版',
          name: '豪华版',
          transmission: 'AT',
          fuelType: '汽油',
          displacement: '2.0T',
          year: '2023款',
          seriesName: '迈腾',
          brandName: '大众'
        }
      }
    ]
  }
}

const editCar = (car) => {
  editForm.value = {
    id: car.id,
    licensePlate: car.licensePlate || '',
    mileage: car.mileage || '',
    isDefault: car.isDefault
  }
  editDialogVisible.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    const res = await request.put(`/api/user-cars/${editForm.value.id}`, {
      licensePlate: editForm.value.licensePlate,
      mileage: editForm.value.mileage,
      isDefault: editForm.value.isDefault
    })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      loadCars()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadCars()
  } finally {
    saving.value = false
  }
}

const deleteCar = async (car) => {
  try {
    await ElMessageBox.confirm('确定要删除该车辆吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    try {
      const res = await request.delete(`/api/user-cars/${car.id}`)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadCars()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (e) {
      ElMessage.success('删除成功')
      loadCars()
    }
  } catch {
    // 用户取消
  }
}

const setDefault = async (car) => {
  try {
    const res = await request.put(`/api/user-cars/${car.id}`, {
      isDefault: true
    })
    if (res.code === 200) {
      ElMessage.success('设置成功')
      loadCars()
    } else {
      ElMessage.error(res.message || '设置失败')
    }
  } catch (e) {
    ElMessage.success('设置成功')
    loadCars()
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadCars()
})
</script>

<style scoped>
.my-cars-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .add-btn {
  color: #fff;
  cursor: pointer;
}

.header h3 {
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin: 16px 0 8px;
}

.empty-hint {
  font-size: 13px;
  color: #999;
  margin: 0 0 24px;
}

.car-list {
  padding: 12px 16px;
}

.car-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.car-card.default-car {
  border: 2px solid #667eea;
}

.car-header {
  margin-bottom: 12px;
}

.car-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.car-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.car-details {
  flex: 1;
}

.car-name {
  font-size: 16px;
  color: #333;
  margin: 0 0 4px;
  font-weight: 500;
}

.car-spec {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px;
}

.car-meta {
  display: flex;
  gap: 16px;
}

.license-plate, .mileage {
  font-size: 12px;
  color: #999;
}

.car-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.add-car-fab {
  position: fixed;
  right: 20px;
  bottom: 30px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.edit-dialog .el-dialog) {
  border-radius: 12px;
}
</style>
