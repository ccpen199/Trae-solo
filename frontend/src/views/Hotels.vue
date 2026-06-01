<template>
  <div class="hotels">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>酒店管理</span>
          <el-button type="primary" @click="openHotelDialog">
            <el-icon><Plus /></el-icon>
            添加酒店
          </el-button>
        </div>
      </template>

      <el-table :data="hotels" v-loading="loading">
        <el-table-column prop="name" label="酒店名称" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="contact" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openRoomTypeDialog(row)">房型</el-button>
            <el-button type="primary" link size="small" @click="editHotel(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteHotel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="hotelDialogVisible" :title="isEditing ? '编辑酒店' : '添加酒店'" width="500px">
      <el-form :model="hotelForm" label-width="80px">
        <el-form-item label="酒店名称">
          <el-input v-model="hotelForm.name" placeholder="请输入酒店名称" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="hotelForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="hotelForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="hotelForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="hotelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveHotel">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roomTypeDialogVisible" title="房型管理" width="600px">
      <div style="margin-bottom: 16px">
        <el-button type="primary" size="small" @click="openAddRoomType">
          <el-icon><Plus /></el-icon>
          添加房型
        </el-button>
      </div>
      <el-table :data="roomTypes" size="small">
        <el-table-column prop="name" label="房型名称" />
        <el-table-column prop="beds" label="床位数" />
        <el-table-column prop="description" label="描述" />
      </el-table>
      
      <el-divider />
      <el-form :model="roomTypeForm" label-width="80px">
        <el-form-item label="房型名称">
          <el-input v-model="roomTypeForm.name" placeholder="请输入房型名称" />
        </el-form-item>
        <el-form-item label="床位数">
          <el-input-number v-model="roomTypeForm.beds" :min="1" :max="3" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roomTypeForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveRoomType">保存房型</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { hotelApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const hotels = ref([])
const hotelDialogVisible = ref(false)
const roomTypeDialogVisible = ref(false)
const isEditing = ref(false)
const currentHotel = ref(null)
const roomTypes = ref([])

const hotelForm = ref({
  name: '',
  address: '',
  contact: '',
  phone: ''
})

const roomTypeForm = ref({
  name: '',
  beds: 1,
  description: ''
})

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadHotels = async () => {
  loading.value = true
  try {
    const res = await hotelApi.getAll()
    if (res.success) {
      hotels.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const openHotelDialog = (row = null) => {
  isEditing.value = !!row
  if (row) {
    hotelForm.value = { ...row }
  } else {
    hotelForm.value = { name: '', address: '', contact: '', phone: '' }
  }
  hotelDialogVisible.value = true
}

const editHotel = (row) => {
  openHotelDialog(row)
}

const saveHotel = async () => {
  try {
    if (isEditing.value) {
      await hotelApi.update(hotelForm.value.id, hotelForm.value)
      ElMessage.success('更新成功')
    } else {
      await hotelApi.create(hotelForm.value)
      ElMessage.success('添加成功')
    }
    hotelDialogVisible.value = false
    loadHotels()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteHotel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该酒店吗？', '提示', { type: 'warning' })
    await hotelApi.delete(row.id)
    ElMessage.success('删除成功')
    loadHotels()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const openRoomTypeDialog = async (hotel) => {
  currentHotel.value = hotel
  roomTypeDialogVisible.value = true
  roomTypeForm.value = { name: '', beds: 1, description: '' }
  try {
    const res = await hotelApi.getRoomTypes(hotel.id)
    if (res.success) {
      roomTypes.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载房型失败')
  }
}

const openAddRoomType = () => {
  roomTypeForm.value = { name: '', beds: 1, description: '' }
}

const saveRoomType = async () => {
  try {
    await hotelApi.createRoomType({
      hotel_id: currentHotel.value.id,
      ...roomTypeForm.value
    })
    ElMessage.success('添加成功')
    roomTypeForm.value = { name: '', beds: 1, description: '' }
    const res = await hotelApi.getRoomTypes(currentHotel.value.id)
    if (res.success) {
      roomTypes.value = res.data
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadHotels()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
