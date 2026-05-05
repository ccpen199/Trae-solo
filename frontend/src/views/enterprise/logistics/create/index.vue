<template>
  <div class="create-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新增物流单</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="140px"
        style="max-width: 800px"
      >
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="物流单号" prop="logisticsNo">
          <el-input v-model="formData.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>
        <el-form-item label="代单号">
          <el-input v-model="formData.proxyNo" placeholder="请输入代单号（选填）" />
        </el-form-item>

        <el-divider content-position="left">货物信息</el-divider>
        <el-form-item label="货物名称" prop="goodsName">
          <el-input v-model="formData.goodsName" placeholder="请输入货物名称" />
        </el-form-item>
        <el-form-item label="货物数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            style="width: 100%"
            placeholder="请输入货物数量"
          />
        </el-form-item>
        <el-form-item label="货物重量">
          <el-input-number
            v-model="formData.weight"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入货物重量（吨，选填）"
          />
        </el-form-item>
        <el-form-item label="货物体积">
          <el-input-number
            v-model="formData.volume"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入货物体积（m³，选填）"
          />
        </el-form-item>

        <el-divider content-position="left">企业信息</el-divider>
        <el-form-item label="生产企业编号">
          <el-input v-model="formData.productionEnterpriseCode" placeholder="请输入生产企业编号（选填）" />
        </el-form-item>
        <el-form-item label="生产企业名称">
          <el-input v-model="formData.productionEnterpriseName" placeholder="请输入生产企业名称（选填）" />
        </el-form-item>
        <el-form-item label="发起企业编号">
          <el-input v-model="formData.initiatorEnterpriseCode" placeholder="请输入发起企业编号（选填）" />
        </el-form-item>
        <el-form-item label="发起企业名称">
          <el-input v-model="formData.initiatorEnterpriseName" placeholder="请输入发起企业名称（选填）" />
        </el-form-item>
        <el-form-item label="中转企业编号">
          <el-input v-model="formData.transferEnterpriseCode" placeholder="请输入中转企业编号（选填）" />
        </el-form-item>
        <el-form-item label="中转企业名称">
          <el-input v-model="formData.transferEnterpriseName" placeholder="请输入中转企业名称（选填）" />
        </el-form-item>
        <el-form-item label="接收企业编号">
          <el-input v-model="formData.receiverEnterpriseCode" placeholder="请输入接收企业编号（选填）" />
        </el-form-item>
        <el-form-item label="接收企业名称">
          <el-input v-model="formData.receiverEnterpriseName" placeholder="请输入接收企业名称（选填）" />
        </el-form-item>
        <el-divider content-position="left">地址信息</el-divider>
        <el-form-item label="发货地址" prop="shipmentAddress">
          <el-input v-model="formData.shipmentAddress" placeholder="请输入发货地址" />
        </el-form-item>
        <el-form-item label="收货地址" prop="deliveryAddress">
          <el-input v-model="formData.deliveryAddress" placeholder="请输入收货地址" />
        </el-form-item>

        <el-divider content-position="left">时间信息</el-divider>
        <el-form-item label="计划发货时间">
          <el-date-picker
            v-model="formData.shipmentDate"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="计划到达时间">
          <el-date-picker
            v-model="formData.expectedDeliveryDate"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { logisticsApi } from '@/api/logistics';

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive({
  logisticsNo: '',
  proxyNo: '',
  goodsName: '',
  quantity: 1,
  weight: 0,
  volume: 0,
  productionEnterpriseCode: '',
  productionEnterpriseName: '',
  initiatorEnterpriseCode: '',
  initiatorEnterpriseName: '',
  transferEnterpriseCode: '',
  transferEnterpriseName: '',
  receiverEnterpriseCode: '',
  receiverEnterpriseName: '',
  shipmentAddress: '',
  deliveryAddress: '',
  shipmentDate: '',
  expectedDeliveryDate: '',
});

const rules: FormRules = {
  logisticsNo: [
    { required: true, message: '请输入物流单号', trigger: 'blur' },
  ],
  goodsName: [
    { required: true, message: '请输入货物名称', trigger: 'blur' },
  ],
  quantity: [
    { required: true, message: '请输入货物数量', trigger: 'blur' },
  ],
  shipmentAddress: [
    { required: true, message: '请输入发货地址', trigger: 'blur' },
  ],
  deliveryAddress: [
    { required: true, message: '请输入收货地址', trigger: 'blur' },
  ],
};

const handleBack = () => {
  router.back();
};

const handleReset = () => {
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const params = { ...formData };
        if (params.weight === 0) delete params.weight;
        if (params.volume === 0) delete params.volume;
        if (!params.productionEnterpriseCode) delete params.productionEnterpriseCode;
        if (!params.productionEnterpriseName) delete params.productionEnterpriseName;
        if (!params.initiatorEnterpriseCode) delete params.initiatorEnterpriseCode;
        if (!params.initiatorEnterpriseName) delete params.initiatorEnterpriseName;
        if (!params.transferEnterpriseCode) delete params.transferEnterpriseCode;
        if (!params.transferEnterpriseName) delete params.transferEnterpriseName;
        if (!params.receiverEnterpriseCode) delete params.receiverEnterpriseCode;
        if (!params.receiverEnterpriseName) delete params.receiverEnterpriseName;
        if (!params.shipmentDate) delete params.shipmentDate;
        if (!params.expectedDeliveryDate) delete params.expectedDeliveryDate;
        if (!params.proxyNo) delete params.proxyNo;

        await logisticsApi.create(params);
        ElMessage.success('创建成功');
        router.push('/enterprise/logistics/initiator');
      } catch (error) {
        console.error('Create error:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.create-page {
  height: 100%;
  padding-bottom: 40px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
