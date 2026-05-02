<template>
  <Layout>
    <el-row :gutter="20">
      <el-col :span="12" :offset="6">
        <el-card class="page-card">
          <template #header>
            <span style="font-size: 18px; font-weight: bold;">发起叫车</span>
          </template>

          <el-form :model="orderForm" :rules="orderRules" ref="orderFormRef" label-width="100px">
            <el-form-item label="出发地址" prop="start_address">
              <el-input 
                v-model="orderForm.start_address" 
                placeholder="请输入出发地址"
                size="large"
              />
            </el-form-item>
            
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="纬度" prop="start_lat">
                  <el-input-number 
                    v-model="orderForm.start_lat" 
                    :precision="6"
                    :min="-90"
                    :max="90"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="经度" prop="start_lng">
                  <el-input-number 
                    v-model="orderForm.start_lng" 
                    :precision="6"
                    :min="-180"
                    :max="180"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="目的地址" prop="end_address">
              <el-input 
                v-model="orderForm.end_address" 
                placeholder="请输入目的地址"
                size="large"
              />
            </el-form-item>
            
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="纬度" prop="end_lat">
                  <el-input-number 
                    v-model="orderForm.end_lat" 
                    :precision="6"
                    :min="-90"
                    :max="90"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="经度" prop="end_lng">
                  <el-input-number 
                    v-model="orderForm.end_lng" 
                    :precision="6"
                    :min="-180"
                    :max="180"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="车型" prop="ride_type">
              <el-select v-model="orderForm.ride_type" size="large" style="width: 100%;">
                <el-option label="经济型 (起步价¥13)" value="standard" />
                <el-option label="舒适型 (起步价¥20)" value="premium" />
                <el-option label="豪华型 (起步价¥50)" value="luxury" />
              </el-select>
            </el-form-item>

            <el-form-item label="备注" prop="passenger_note">
              <el-input 
                v-model="orderForm.passenger_note" 
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息（选填）"
              />
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                :loading="loading"
                @click="handleCreateOrder"
                style="width: 100%; height: 50px; font-size: 18px;"
              >
                立即叫车
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="priceEstimate" class="page-card" style="margin-top: 20px;">
          <template #header>
            <span>价格预估</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="预估价格">
              <span style="font-size: 24px; font-weight: bold; color: #409eff;">
                ¥{{ priceEstimate.estimatedPrice }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="起步价">
              ¥{{ priceEstimate.baseFee }}
            </el-descriptions-item>
            <el-descriptions-item label="里程费">
              ¥{{ priceEstimate.distanceFee }}
            </el-descriptions-item>
            <el-descriptions-item label="时长费">
              ¥{{ priceEstimate.timeFee }}
            </el-descriptions-item>
            <el-descriptions-item label="高峰时段" v-if="priceEstimate.isPeakTime">
              <el-tag type="warning">是 (1.5倍)</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="夜间时段" v-if="priceEstimate.isNightTime">
              <el-tag type="info">是 (1.3倍)</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="page-card" style="margin-top: 20px;">
          <template #header>
            <span>快速填写示例</span>
          </template>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <el-button @click="fillSample(1)">示例1: 国贸 → 北京站</el-button>
            <el-button @click="fillSample(2)">示例2: 望京 → 首都机场</el-button>
            <el-button @click="fillSample(3)">示例3: 中关村 → 三里屯</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </Layout>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Layout from '../components/Layout.vue';
import { orderApi } from '../api';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const orderFormRef = ref(null);
const loading = ref(false);
const priceEstimate = ref(null);

const orderForm = reactive({
  start_address: '',
  start_lat: 39.9042,
  start_lng: 116.4074,
  end_address: '',
  end_lat: 39.9142,
  end_lng: 116.4174,
  ride_type: 'standard',
  passenger_note: ''
});

const orderRules = {
  start_address: [{ required: true, message: '请输入出发地址', trigger: 'blur' }],
  start_lat: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
  start_lng: [{ required: true, message: '请输入经度', trigger: 'blur' }],
  end_address: [{ required: true, message: '请输入目的地址', trigger: 'blur' }],
  end_lat: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
  end_lng: [{ required: true, message: '请输入经度', trigger: 'blur' }]
};

const calculatePrice = () => {
  const lat1 = orderForm.start_lat;
  const lng1 = orderForm.start_lng;
  const lat2 = orderForm.end_lat;
  const lng2 = orderForm.end_lng;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const rules = {
    standard: { baseFee: 13.0, distanceFee: 2.3, timeFee: 0.5 },
    premium: { baseFee: 20.0, distanceFee: 3.5, timeFee: 0.8 },
    luxury: { baseFee: 50.0, distanceFee: 5.0, timeFee: 1.5 }
  };

  const rule = rules[orderForm.ride_type];
  const now = new Date();
  const hour = now.getHours();
  const isPeakTime = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
  const isNightTime = hour >= 23 || hour < 6;

  let totalPrice = rule.baseFee;
  totalPrice += distance * rule.distanceFee;
  const estimatedMinutes = distance * 4;
  totalPrice += (estimatedMinutes / 60) * rule.timeFee;

  if (isPeakTime) totalPrice *= 1.5;
  if (isNightTime) totalPrice *= 1.3;

  totalPrice = Math.max(totalPrice, rule.baseFee);

  priceEstimate.value = {
    estimatedPrice: Math.round(totalPrice * 100) / 100,
    baseFee: rule.baseFee,
    distanceFee: Math.round(distance * rule.distanceFee * 100) / 100,
    timeFee: Math.round((estimatedMinutes / 60) * rule.timeFee * 100) / 100,
    isPeakTime,
    isNightTime
  };
};

const fillSample = (type) => {
  if (type === 1) {
    orderForm.start_address = '北京市朝阳区国贸中心';
    orderForm.start_lat = 39.9087;
    orderForm.start_lng = 116.4605;
    orderForm.end_address = '北京市东城区北京站';
    orderForm.end_lat = 39.9042;
    orderForm.end_lng = 116.4274;
  } else if (type === 2) {
    orderForm.start_address = '北京市朝阳区望京SOHO';
    orderForm.start_lat = 40.0028;
    orderForm.start_lng = 116.4704;
    orderForm.end_address = '北京市顺义区首都机场T3';
    orderForm.end_lat = 40.0799;
    orderForm.end_lng = 116.6031;
  } else if (type === 3) {
    orderForm.start_address = '北京市海淀区中关村';
    orderForm.start_lat = 39.9834;
    orderForm.start_lng = 116.3169;
    orderForm.end_address = '北京市朝阳区三里屯';
    orderForm.end_lat = 39.9345;
    orderForm.end_lng = 116.4517;
  }
};

const handleCreateOrder = async () => {
  if (!orderFormRef.value) return;
  
  await orderFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const result = await orderApi.create({
          passenger_id: userStore.profile.id,
          ...orderForm
        });
        
        if (result.success) {
          ElMessage.success('叫车成功！正在为您匹配司机...');
          router.push(`/order/${result.order.id}`);
        } else {
          ElMessage.error(result.error || result.errors?.join(', ') || '叫车失败');
        }
      } catch (error) {
        ElMessage.error(error.error || '叫车失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

watch(
  () => [orderForm.start_lat, orderForm.start_lng, orderForm.end_lat, orderForm.end_lng, orderForm.ride_type],
  () => calculatePrice(),
  { immediate: true }
);
</script>
