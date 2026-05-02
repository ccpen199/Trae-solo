<template>
  <div class="create-recall">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>发起召回</h3>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-form :model="recallForm" label-width="120px" class="recall-form">
        <el-form-item label="批次号" required>
          <el-input v-model="recallForm.batch_code" placeholder="请输入或扫描批次号" />
        </el-form-item>
        
        <el-form-item label="召回原因" required>
          <el-input
            v-model="recallForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入召回原因"
          />
        </el-form-item>
        
        <el-form-item label="召回等级" required>
          <el-radio-group v-model="recallForm.level">
            <el-radio label="minor">轻微</el-radio>
            <el-radio label="major">重要</el-radio>
            <el-radio label="serious">严重</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="受影响数量">
          <el-input-number v-model="recallForm.affected_quantity" :min="0" />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="recallForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitRecall">提交召回</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 终端定位结果 -->
    <el-card shadow="hover" class="terminal-result" v-if="terminalLocations.length > 0">
      <template #header>
        <h3>终端定位结果</h3>
      </template>
      <el-table :data="terminalLocations" style="width: 100%">
        <el-table-column prop="terminal_name" label="终端名称" />
        <el-table-column prop="terminal_type" label="终端类型" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="status" label="状态" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" type="danger" @click="handleOffShelf(scope.row)">
              下架处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const recallForm = ref({
  batch_code: '',
  reason: '',
  level: 'major',
  affected_quantity: 0,
  notes: ''
})

const terminalLocations = ref([])

const submitRecall = async () => {
  if (!recallForm.value.batch_code || !recallForm.value.reason) {
    console.log('请填写必填项')
    return
  }
  
  // 模拟提交
  console.log('提交召回:', recallForm.value)
  
  // 模拟终端定位结果
  terminalLocations.value = [
    {
      terminal_name: '永辉超市-北京朝阳店',
      terminal_type: '零售门店',
      location: '北京市朝阳区',
      quantity: 500,
      status: '待处理'
    },
    {
      terminal_name: '物美超市-上海浦东店',
      terminal_type: '零售门店',
      location: '上海市浦东新区',
      quantity: 300,
      status: '待处理'
    }
  ]
}

const handleOffShelf = (terminal) => {
  console.log('下架处理:', terminal)
}

const goBack = () => {
  router.push('/recall/records')
}
</script>

<style scoped>
.create-recall {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.recall-form {
  max-width: 600px;
  margin: 20px 0;
}

.terminal-result {
  margin-top: 20px;
}

.terminal-result h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}
</style>
