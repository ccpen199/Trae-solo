<template>
  <div class="task-create-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>创建冷链任务</span>
        </div>
      </template>
      
      <el-form :model="taskForm" :rules="rules" ref="taskFormRef" label-width="120px">
        <el-divider content-position="left">货品信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="货品名称" prop="goodsInfo.name">
              <el-input v-model="taskForm.goodsInfo.name" placeholder="请输入货品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货品数量" prop="goodsInfo.quantity">
              <el-input-number v-model="taskForm.goodsInfo.quantity" :min="1" placeholder="请输入数量" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="货品重量" prop="goodsInfo.weight">
              <el-input v-model="taskForm.goodsInfo.weight" placeholder="请输入重量(kg)">
                <template #append>kg</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货品品类" prop="goodsInfo.category">
              <el-select v-model="taskForm.goodsInfo.category" placeholder="请选择品类" style="width: 100%">
                <el-option label="生鲜食品" value="fresh" />
                <el-option label="医药制品" value="medicine" />
                <el-option label="冷冻食品" value="frozen" />
                <el-option label="奶制品" value="dairy" />
                <el-option label="水果蔬菜" value="produce" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">温控要求</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低温度" prop="temperatureRange.min">
              <el-input-number v-model="taskForm.temperatureRange.min" :step="1" :precision="1" placeholder="最低温度">
                <template #append>°C</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高温度" prop="temperatureRange.max">
              <el-input-number v-model="taskForm.temperatureRange.max" :step="1" :precision="1" placeholder="最高温度">
                <template #append>°C</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="湿度要求" prop="humidityRange">
          <el-input v-model="taskForm.humidityRange" placeholder="如: 40%-60%" style="width: 50%" />
        </el-form-item>
        
        <el-divider content-position="left">时效要求</el-divider>
        
        <el-form-item label="运输时效" prop="timeLimit">
          <el-input v-model="taskForm.timeLimit" placeholder="如: 24小时内送达" style="width: 50%" />
        </el-form-item>
        
        <el-form-item label="备注说明" prop="remarks">
          <el-input v-model="taskForm.remarks" type="textarea" :rows="3" placeholder="请输入备注说明" style="width: 80%" />
        </el-form-item>
        
        <el-divider content-position="left">地址信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起始地址" prop="startLocation.address">
              <el-input v-model="taskForm.startLocation.address" placeholder="请输入起始地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的地" prop="endLocation.address">
              <el-input v-model="taskForm.endLocation.address" placeholder="请输入目的地" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">创建任务</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const taskFormRef = ref(null)
const submitting = ref(false)

const taskForm = reactive({
  goodsInfo: {
    name: '',
    quantity: 1,
    weight: '',
    category: ''
  },
  temperatureRange: {
    min: -18,
    max: 5
  },
  humidityRange: '',
  timeLimit: '',
  remarks: '',
  startLocation: {
    address: '',
    lat: null,
    lng: null
  },
  endLocation: {
    address: '',
    lat: null,
    lng: null
  }
})

const rules = {
  'goodsInfo.name': [{ required: true, message: '请输入货品名称', trigger: 'blur' }],
  'temperatureRange.min': [{ required: true, message: '请输入最低温度', trigger: 'blur' }],
  'temperatureRange.max': [{ required: true, message: '请输入最高温度', trigger: 'blur' }],
  'startLocation.address': [{ required: true, message: '请输入起始地址', trigger: 'blur' }],
  'endLocation.address': [{ required: true, message: '请输入目的地', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const payload = {
          shipper: { userId: userStore.userInfo.userId },
          goodsInfo: taskForm.goodsInfo,
          temperatureRange: taskForm.temperatureRange,
          timeLimit: taskForm.timeLimit,
          startLocation: taskForm.startLocation,
          endLocation: taskForm.endLocation
        }
        
        const response = await axios.post('/tasks', payload)
        if (response.data.taskId) {
          ElMessage.success('任务创建成功')
          router.push('/tasks')
        }
      } catch (error) {
        ElMessage.error('创建任务失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
})
</script>

<style scoped>
.task-create-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}
</style>
