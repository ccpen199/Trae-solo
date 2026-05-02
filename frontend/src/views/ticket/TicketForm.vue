<template>
  <div class="ticket-form-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/tickets' }">工单管理</el-breadcrumb-item>
            <el-breadcrumb-item>新建工单</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入工单标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择工单类型" style="width: 100%">
                <el-option label="告警工单" value="alert" />
                <el-option label="指标工单" value="metric" />
                <el-option label="事件工单" value="incident" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="高" value="high">
                  <span style="color: #f56c6c;">●</span> 高
                </el-option>
                <el-option label="中" value="medium">
                  <span style="color: #e6a23c;">●</span> 中
                </el-option>
                <el-option label="低" value="low">
                  <span style="color: #909399;">●</span> 低
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望完成时间" prop="expected_finish_time">
              <el-date-picker
                v-model="form.expected_finish_time"
                type="datetime"
                placeholder="请选择期望完成时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入工单描述"
          />
        </el-form-item>

        <el-divider content-position="left">
          <span style="font-weight: bold;">指标信息</span>
        </el-divider>

        <div v-if="form.metrics.length > 0">
          <el-table :data="form.metrics" border style="width: 100%">
            <el-table-column prop="name" label="指标名称" width="180">
              <template #default="{ row, $index }">
                <el-input v-model="form.metrics[$index].name" placeholder="指标名称" />
              </template>
            </el-table-column>
            <el-table-column prop="metric_type" label="类型" width="120">
              <template #default="{ row, $index }">
                <el-select v-model="form.metrics[$index].metric_type" placeholder="类型" style="width: 100%">
                  <el-option label="计数器" value="counter" />
                  <el-option label="仪表盘" value="gauge" />
                  <el-option label="直方图" value="histogram" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="value" label="当前值">
              <template #default="{ row, $index }">
                <el-input v-model="form.metrics[$index].value" placeholder="当前值" />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="100">
              <template #default="{ row, $index }">
                <el-input v-model="form.metrics[$index].unit" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="阈值">
              <template #default="{ row, $index }">
                <el-input v-model="form.metrics[$index].threshold" placeholder="告警阈值" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeMetric($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <el-button type="primary" link @click="addMetric" style="margin-top: 10px;">
          <el-icon><Plus /></el-icon> 添加指标
        </el-button>

        <el-form-item style="margin-top: 30px;">
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            <el-icon><Check /></el-icon> 提交工单
          </el-button>
          <el-button @click="handleSaveDraft">
            <el-icon><Document /></el-icon> 保存草稿
          </el-button>
          <el-button @click="router.back()">
            <el-icon><Back /></el-icon> 返回
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, Check, Document, Back } from '@element-plus/icons-vue';
import { ticketApi } from '@/api';

const router = useRouter();

const formRef = ref(null);
const loading = ref(false);

const form = reactive({
  title: '',
  description: '',
  type: 'alert',
  priority: 'medium',
  expected_finish_time: '',
  metrics: []
});

const rules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }]
};

const addMetric = () => {
  form.metrics.push({
    name: '',
    metric_type: 'gauge',
    value: '',
    unit: '',
    threshold: '',
    description: ''
  });
};

const removeMetric = (index) => {
  form.metrics.splice(index, 1);
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  
  loading.value = true;
  try {
    const data = {
      ...form,
      metrics: form.metrics.filter(m => m.name)
    };
    
    const result = await ticketApi.create(data);
    ElMessage.success('工单创建成功');
    router.push(`/tickets/${result.data.ticket.id}`);
  } catch (error) {
    console.error('创建工单失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSaveDraft = async () => {
  if (!form.title) {
    ElMessage.warning('请输入工单标题');
    return;
  }
  
  loading.value = true;
  try {
    const data = {
      ...form,
      metrics: form.metrics.filter(m => m.name)
    };
    
    const result = await ticketApi.create(data);
    ElMessage.success('草稿保存成功');
    router.push(`/tickets/${result.data.ticket.id}`);
  } catch (error) {
    console.error('保存草稿失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
