<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">创建检验</h2>
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
            <el-form-item label="检验类型" prop="type">
              <el-select
                v-model="form.type"
                placeholder="请选择检验类型"
                style="width: 100%"
              >
                <el-option label="工序检验" :value="InspectionType.PROCESS" />
                <el-option label="完工检验" :value="InspectionType.FINAL" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联工单" prop="workOrderId">
              <el-select
                v-model="form.workOrderId"
                placeholder="请选择工单"
                filterable
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
        </el-row>
        <el-row :gutter="20" v-if="form.type === InspectionType.PROCESS">
          <el-col :span="12">
            <el-form-item label="关联工序" prop="workOrderProcessId">
              <el-select
                v-model="form.workOrderProcessId"
                placeholder="请选择工序"
                filterable
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
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="检验数量" prop="inspectQty">
              <el-input-number
                v-model="form.inspectQty"
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合格数量" prop="passQty">
              <el-input-number
                v-model="form.passQty"
                :min="0"
                :max="form.inspectQty"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="不合格数量" prop="failQty">
              <el-input-number
                v-model="form.failQty"
                :min="0"
                :max="form.inspectQty"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检验结果" prop="result">
              <el-radio-group v-model="form.result">
                <el-radio :value="InspectionResult.PASS">合格</el-radio>
                <el-radio :value="InspectionResult.FAIL">不合格</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="form.result === InspectionResult.FAIL" label="不合格原因" prop="failReason">
          <el-input
            v-model="form.failReason"
            type="textarea"
            :rows="3"
            placeholder="请输入不合格原因"
          />
        </el-form-item>
        <el-form-item v-if="form.result === InspectionResult.FAIL" label="处理措施" prop="treatment">
          <el-input
            v-model="form.treatment"
            type="textarea"
            :rows="3"
            placeholder="请输入处理措施"
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
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { qualityApi } from '@/api/quality';
import { workOrderApi } from '@/api/workOrder';
import { InspectionType, InspectionResult } from '@/types';

const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);

const workOrders = ref<any[]>([]);
const processes = ref<any[]>([]);

const form = reactive({
  type: InspectionType.PROCESS,
  workOrderId: null as number | null,
  workOrderProcessId: null as number | null,
  inspectQty: 1,
  passQty: 0,
  failQty: 0,
  result: InspectionResult.PASS,
  failReason: '',
  treatment: '',
  remark: '',
});

const rules: FormRules = {
  type: [{ required: true, message: '请选择检验类型', trigger: 'change' }],
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
  inspectQty: [{ required: true, message: '请输入检验数量', trigger: 'blur' }],
  result: [{ required: true, message: '请选择检验结果', trigger: 'change' }],
  failReason: [
    {
      required: true,
      message: '不合格时请输入不合格原因',
      trigger: 'blur',
    },
  ],
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

watch(
  () => [form.inspectQty, form.passQty],
  () => {
    if (form.inspectQty > 0 && form.passQty > 0) {
      form.failQty = form.inspectQty - form.passQty;
      if (form.failQty < 0) form.failQty = 0;
    }
  }
);

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data: any = {
        type: form.type,
        workOrderId: form.workOrderId!,
        inspectQty: form.inspectQty,
        passQty: form.passQty,
        failQty: form.failQty,
        result: form.result,
      };
      if (form.workOrderProcessId) data.workOrderProcessId = form.workOrderProcessId;
      if (form.failReason) data.failReason = form.failReason;
      if (form.treatment) data.treatment = form.treatment;
      if (form.remark) data.remark = form.remark;

      await qualityApi.create(data);
      ElMessage.success('检验创建成功');
      router.push('/quality');
    } catch {
      ElMessage.error('创建失败');
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
