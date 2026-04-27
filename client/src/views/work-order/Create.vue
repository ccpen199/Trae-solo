<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">创建工单</h2>
      <div>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span class="card-title">基本信息</span>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            label-position="left"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="产品名称" prop="productName">
                  <el-input v-model="form.productName" placeholder="请输入产品名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="产品规格" prop="productSpec">
                  <el-input v-model="form.productSpec" placeholder="请输入产品规格" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="计划数量" prop="plannedQty">
                  <el-input-number
                    v-model="form.plannedQty"
                    :min="1"
                    :max="100000"
                    placeholder="请输入计划数量"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级" prop="priority">
                  <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%;">
                    <el-option label="低" value="LOW" />
                    <el-option label="中" value="MEDIUM" />
                    <el-option label="高" value="HIGH" />
                    <el-option label="紧急" value="URGENT" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="计划开始日期" prop="plannedStartDate">
                  <el-date-picker
                    v-model="form.plannedStartDate"
                    type="date"
                    placeholder="请选择日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="计划完成日期" prop="plannedEndDate">
                  <el-date-picker
                    v-model="form.plannedEndDate"
                    type="date"
                    placeholder="请选择日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="关联工艺路线" prop="processRouteId">
              <el-select
                v-model="form.processRouteId"
                placeholder="请选择工艺路线（必填）"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="route in processRoutes"
                  :key="route.id"
                  :label="route.name"
                  :value="route.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span class="card-title">绑定物料</span>
          </template>
          <el-button type="primary" link size="small" style="margin-bottom: 12px;" @click="showMaterialDialog = true">
            <el-icon><Plus /></el-icon>
            添加物料
          </el-button>
          <el-table :data="form.materials" size="small" border>
            <el-table-column prop="materialName" label="物料" />
            <el-table-column prop="qty" label="数量" width="80" />
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" link size="small" @click="removeMaterial(scope.$index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-card>
          <template #header>
            <span class="card-title">绑定设备</span>
          </template>
          <el-button type="primary" link size="small" style="margin-bottom: 12px;" @click="showEquipmentDialog = true">
            <el-icon><Plus /></el-icon>
            添加设备
          </el-button>
          <el-table :data="form.equipmentIds" size="small" border>
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="equipmentNo" label="设备编号" />
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" link size="small" @click="removeEquipment(scope.$index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showMaterialDialog" title="选择物料" width="600px">
      <el-table :data="materials" v-loading="materialLoading" @selection-change="handleMaterialSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="materialNo" label="物料编号" />
        <el-table-column prop="name" label="物料名称" />
        <el-table-column prop="spec" label="规格" />
      </el-table>
      <template #footer>
        <el-button @click="showMaterialDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMaterialSelection">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEquipmentDialog" title="选择设备" width="600px">
      <el-table :data="equipments" v-loading="equipmentLoading" @selection-change="handleEquipmentSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="equipmentNo" label="设备编号" />
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <span :class="'status-tag status-tag-' + getEquipmentStatusClass(scope.row.status)">
              {{ getEquipmentStatusLabel(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showEquipmentDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEquipmentSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { workOrderApi } from '@/api/workOrder';
import { masterDataApi } from '@/api/masterData';
import { EquipmentStatus, EquipmentStatusLabels } from '@/types';

const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const showMaterialDialog = ref(false);
const showEquipmentDialog = ref(false);
const materialLoading = ref(false);
const equipmentLoading = ref(false);

const processRoutes = ref<any[]>([]);
const materials = ref<any[]>([]);
const equipments = ref<any[]>([]);
const selectedMaterials = ref<any[]>([]);
const selectedEquipments = ref<any[]>([]);

const form = reactive({
  productName: '',
  productSpec: '',
  plannedQty: 1,
  priority: 'MEDIUM',
  plannedStartDate: '',
  plannedEndDate: '',
  processRouteId: 0,
  remark: '',
  materials: [] as any[],
  equipmentIds: [] as any[],
});

const rules: FormRules = {
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  plannedQty: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
  processRouteId: [{ required: true, message: '请选择工艺路线', trigger: 'change' }],
};

const loadProcessRoutes = async () => {
  try {
    const response = await masterDataApi.listProcessRoutes({ limit: 100 });
    processRoutes.value = response.data?.items || [];
  } catch {
    // ignore
  }
};

const loadMaterials = async () => {
  materialLoading.value = true;
  try {
    const response = await masterDataApi.listMaterials({ limit: 100 });
    materials.value = response.data?.items || [];
  } finally {
    materialLoading.value = false;
  }
};

const loadEquipments = async () => {
  equipmentLoading.value = true;
  try {
    const response = await masterDataApi.listEquipments({ limit: 100 });
    equipments.value = response.data?.items || [];
  } finally {
    equipmentLoading.value = false;
  }
};

const handleMaterialSelection = (selection: any[]) => {
  selectedMaterials.value = selection;
};

const handleEquipmentSelection = (selection: any[]) => {
  selectedEquipments.value = selection;
};

const confirmMaterialSelection = () => {
  selectedMaterials.value.forEach((m) => {
    const exists = form.materials.find((item: any) => item.materialId === m.id);
    if (!exists) {
      form.materials.push({
        materialId: m.id,
        materialName: m.name,
        qty: 1,
      });
    }
  });
  showMaterialDialog.value = false;
};

const confirmEquipmentSelection = () => {
  selectedEquipments.value.forEach((e) => {
    const exists = form.equipmentIds.find((item: any) => item.id === e.id);
    if (!exists) {
      form.equipmentIds.push(e);
    }
  });
  showEquipmentDialog.value = false;
};

const removeMaterial = (index: number) => {
  form.materials.splice(index, 1);
};

const removeEquipment = (index: number) => {
  form.equipmentIds.splice(index, 1);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        productName: form.productName,
        productSpec: form.productSpec || undefined,
        plannedQty: form.plannedQty,
        priority: form.priority,
        plannedStartDate: form.plannedStartDate || undefined,
        plannedEndDate: form.plannedEndDate || undefined,
        processRouteId: form.processRouteId,
        remark: form.remark || undefined,
        materialIds: form.materials.map((m: any) => ({ id: m.materialId, qty: m.qty })),
        equipmentIds: form.equipmentIds.map((e: any) => e.id),
      };

      await workOrderApi.create(data);
      ElMessage.success('工单创建成功');
      router.push('/work-orders');
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

const getEquipmentStatusLabel = (status: string) =>
  EquipmentStatusLabels[status as EquipmentStatus] || status;

const getEquipmentStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [EquipmentStatus.AVAILABLE]: 'success',
    [EquipmentStatus.IN_USE]: 'primary',
    [EquipmentStatus.MAINTENANCE]: 'warning',
    [EquipmentStatus.BROKEN]: 'danger',
  };
  return classMap[status] || 'info';
};

onMounted(() => {
  loadProcessRoutes();
  loadMaterials();
  loadEquipments();
});
</script>
