<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">上报异常</h2>
      <div>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </div>
    </div>

    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="异常类型" prop="type">
              <el-select
                v-model="form.type"
                placeholder="请选择异常类型"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, key) in TypeLabels"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select
                v-model="form.priority"
                placeholder="请选择优先级"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, key) in PriorityLabels"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联工单">
              <el-select
                v-model="form.workOrderId"
                placeholder="请选择工单（可选）"
                filterable
                clearable
                style="width: 100%"
                @change="handleWorkOrderChange"
              >
                <el-option
                  v-for="wo in workOrders"
                  :key="wo.id"
                  :label="wo.workOrderNo + ' - ' + wo.productName"
                  :value="wo.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联工序">
              <el-select
                v-model="form.workOrderProcessId"
                placeholder="请选择工序（可选）"
                filterable
                clearable
                style="width: 100%"
                :disabled="!form.workOrderId"
              >
                <el-option
                  v-for="p in processes"
                  :key="p.id"
                  :label="p.processName"
                  :value="p.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述异常情况"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { abnormalApi } from '@/api/abnormal';
import { workOrderApi } from '@/api/workOrder';
import { AbnormalType, AbnormalTypeLabels, AbnormalPriority, AbnormalPriorityLabels } from '@/types';

const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);

const workOrders = ref<any[]>([]);
const processes = ref<any[]>([]);

const TypeLabels = AbnormalTypeLabels;
const PriorityLabels = AbnormalPriorityLabels;

const form = reactive({
  type: '' as AbnormalType | '',
  priority: 'MEDIUM' as AbnormalPriority,
  workOrderId: null as number | null,
  workOrderProcessId: null as number | null,
  description: '',
  remark: '',
});

const rules: FormRules = {
  type: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
};

const loadWorkOrders = async () => {
  try {
    const response = await workOrderApi.list({ limit: 100 });
    workOrders.value = response.data?.items || [];
  } catch {
    // ignore
  }
};

const handleWorkOrderChange = async (workOrderId: number) => {
  form.workOrderProcessId = null;
  processes.value = [];
  if (!workOrderId) return;

  try {
    const response = await workOrderApi.getDetail(workOrderId);
    processes.value = response.data?.processes || [];
  } catch {
    // ignore
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data: any = {
        type: form.type as AbnormalType,
        priority: form.priority,
        description: form.description,
      };
      if (form.workOrderId) data.workOrderId = form.workOrderId;
      if (form.workOrderProcessId) data.workOrderProcessId = form.workOrderProcessId;
      if (form.remark) data.remark = form.remark;

      await abnormalApi.create(data);
      ElMessage.success('异常上报成功');
      router.push('/abnormals');
    } catch {
      ElMessage.error('上报失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleCancel = () => {
  router.back();
};

onMounted(() => {
  loadWorkOrders();
});
</script>
