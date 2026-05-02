<template>
  <div class="order-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/orders' }">订单管理</el-breadcrumb-item>
            <el-breadcrumb-item>创建订单</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="order-form"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入订单标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型类型" prop="modelType">
              <el-select v-model="formData.modelType" placeholder="请选择模型类型" style="width: 100%">
                <el-option
                  v-for="item in MODEL_TYPES"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模型名称" prop="modelName">
              <el-input v-model="formData.modelName" placeholder="请输入模型名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型URL">
              <el-input v-model="formData.modelUrl" placeholder="请输入模型文件URL（可选）" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="成本限额">
              <el-input-number
                v-model="formData.costLimit"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="不填则使用默认限额"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望完成时间">
              <el-date-picker
                v-model="formData.expectCompleteTime"
                type="datetime"
                placeholder="选择期望完成时间"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入订单描述信息"
          />
        </el-form-item>

        <el-divider content-position="left">明细信息（可选）</el-divider>

        <div class="details-section">
          <el-button type="primary" link @click="addDetail">
            <el-icon><Plus /></el-icon>
            添加明细
          </el-button>

          <el-table :data="formData.details" style="width: 100%; margin-top: 12px">
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column label="材质名称" width="180">
              <template #default="{ row }">
                <el-select v-model="row.materialType" placeholder="选择材质" style="width: 100%">
                  <el-option
                    v-for="item in MATERIAL_TYPES"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="材质URL">
              <template #default="{ row }">
                <el-input v-model="row.materialUrl" placeholder="材质文件URL" />
              </template>
            </el-table-column>
            <el-table-column label="热点配置">
              <template #default="{ row }">
                <el-input
                  v-model="row.hotspotConfigText"
                  type="textarea"
                  :rows="2"
                  placeholder="热点配置（JSON格式）"
                  @blur="parseHotspotConfig(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeDetail($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider />

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            创建订单
          </el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { MODEL_TYPES, MATERIAL_TYPES } from '@/utils/constants'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const formData = reactive({
  title: '',
  modelName: '',
  modelType: 'furniture',
  modelUrl: '',
  description: '',
  costLimit: null,
  expectCompleteTime: null,
  details: []
})

const rules = {
  title: [
    { required: true, message: '请输入订单标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  modelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, max: 100, message: '模型名称长度在2到100个字符之间', trigger: 'blur' }
  ],
  modelType: [
    { required: true, message: '请选择模型类型', trigger: 'change' }
  ]
}

function disabledDate(time) {
  return time.getTime() < Date.now() - 8.64e7
}

function addDetail() {
  formData.details.push({
    materialType: '',
    materialUrl: '',
    hotspotConfig: {},
    hotspotConfigText: ''
  })
}

function removeDetail(index) {
  formData.details.splice(index, 1)
}

function parseHotspotConfig(row) {
  if (!row.hotspotConfigText) {
    row.hotspotConfig = {}
    return
  }
  try {
    row.hotspotConfig = JSON.parse(row.hotspotConfigText)
  } catch (e) {
    ElMessage.warning('热点配置JSON格式不正确')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const submitData = {
          title: formData.title,
          modelName: formData.modelName,
          modelType: formData.modelType,
          modelUrl: formData.modelUrl || undefined,
          description: formData.description || undefined,
          costLimit: formData.costLimit || undefined,
          expectCompleteTime: formData.expectCompleteTime 
            ? formData.expectCompleteTime.toISOString() 
            : undefined,
          details: formData.details.map((d, i) => ({
            material_name: MATERIAL_TYPES.find(m => m.value === d.materialType)?.label || d.materialType,
            material_url: d.materialUrl,
            hotspot_config: d.hotspotConfig,
            sequence: i
          }))
        }

        const res = await request.post('/orders', submitData)
        ElMessage.success('订单创建成功')
        router.push(`/orders/${res.data.order.id}`)
      } catch (err) {
        console.error('创建订单失败:', err)
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.order-create {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
}

.order-form {
  max-width: 900px;
}

.details-section {
  padding: 0 0 0 120px;
}
</style>
