<template>
  <div class="service-detail-page page-container">
    <van-nav-bar
      :title="serviceInfo.name"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="service-header">
      <div class="service-icon" :style="{ background: getIconBg(serviceInfo.category) }">
        {{ getServiceMark(serviceInfo.category) }}
      </div>
      <div class="service-title">{{ serviceInfo.name }}</div>
      <div class="service-desc">{{ serviceInfo.description }}</div>
    </div>

    <div class="service-meta">
      <div class="meta-item">
        <van-icon name="location-o" size="14" />
        <span>{{ userStore.province || '全国' }}服务</span>
        <van-tag v-if="serviceInfo.province && serviceInfo.province !== 'national'" size="small" type="primary">属地专属</van-tag>
        <van-tag v-else size="small" type="success">全国通用</van-tag>
      </div>
      <div class="meta-item">
        <van-icon name="cluster-o" size="14" />
        <span>跨省路由: {{ isCrossProvince ? '已启用' : '本地服务' }}</span>
      </div>
      <div v-if="todoId" class="meta-item todo-source">
        <van-icon name="todo-list-o" size="14" />
        <span>来自待办事项 #{{ todoId }}</span>
        <van-tag size="small" type="warning">待办处理</van-tag>
      </div>
    </div>

    <div v-if="normalizedServiceCode === 'pension_verify'" class="service-content">
      <div class="card">
        <div class="card-title">养老金领取资格认证</div>
        <div class="verify-tip">
          <van-icon name="info-o" size="16" color="#1989fa" />
          <span>请确保您的面部清晰可见，光线充足</span>
        </div>
        <div class="face-area">
          <div class="face-placeholder">
            <div class="face-icon">
              <van-icon name="user-o" size="48" />
            </div>
            <div class="face-text">请将面部置于框内</div>
          </div>
        </div>
        <van-button
          block
          type="primary"
          size="large"
          :loading="verifying"
          @click="doPensionVerify"
        >
          {{ verifying ? '认证中...' : '开始人脸识别认证' }}
        </van-button>
      </div>

      <div class="card">
        <div class="card-title">历史认证记录</div>
        <div class="record-item" v-if="lastVerify">
          <div class="record-info">
            <div class="record-date">{{ lastVerify.verify_date }}</div>
            <div class="record-method">认证方式：{{ lastVerify.verify_method === 'face' ? '人脸识别' : '其他' }}</div>
          </div>
          <van-tag type="success">认证成功</van-tag>
        </div>
        <div v-else class="empty-state">
          <van-icon name="orders-o" size="48" />
          <div>暂无认证记录</div>
        </div>
      </div>
    </div>

    <div v-else-if="normalizedServiceCode === 'unemployment'" class="service-content">
      <div class="card">
        <div class="card-title">失业金申领</div>
        <van-form @submit="submitUnemployment">
          <van-cell-group inset>
            <van-field
              v-model="unemploymentForm.reason"
              label="失业原因"
              placeholder="请选择失业原因"
              :rules="[{ required: true, message: '请选择失业原因' }]"
              is-link
              readonly
              @click="showReasonPicker = true"
            />
            <van-field
              v-model="unemploymentForm.bank_card"
              label="银行卡号"
              placeholder="请输入领取银行卡号"
              :rules="[{ required: true, message: '请输入银行卡号' }]"
            />
            <van-field
              v-model="unemploymentForm.contact"
              label="联系电话"
              placeholder="请输入联系电话"
              :rules="[{ required: true, message: '请输入联系电话' }]"
            />
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" native-type="submit" size="large">
              提交申请
            </van-button>
          </div>
        </van-form>
      </div>

      <van-popup v-model:show="showReasonPicker" position="bottom">
        <van-picker
          :columns="reasonOptions"
          @confirm="onReasonConfirm"
          @cancel="showReasonPicker = false"
          title="选择失业原因"
        />
      </van-popup>

      <van-popup v-model:show="showVerifyDialog" round position="center">
        <div class="verify-dialog">
          <div class="verify-title">敏感操作二次验证</div>
          <div class="verify-desc">已向您的手机发送验证码，请输入6位验证码</div>
          <van-field
            v-model="verifyCode"
            center
            placeholder="请输入验证码"
            maxlength="6"
          />
          <div class="verify-actions">
            <van-button type="default" @click="showVerifyDialog = false">取消</van-button>
            <van-button type="primary" @click="confirmVerify">确认</van-button>
          </div>
        </div>
      </van-popup>
    </div>

    <div v-else-if="normalizedServiceCode === 'cert_query'" class="service-content">
      <div class="card">
        <div class="card-title">我的职业资格证书</div>
        <div v-for="cert in certificates" :key="cert.id" class="cert-item">
          <div class="cert-icon">
            <van-icon name="certificate" size="22" />
          </div>
          <div class="cert-info">
            <div class="cert-name">{{ cert.cert_name }}</div>
            <div class="cert-level">{{ cert.level }}</div>
            <div class="cert-meta">
              <span>{{ cert.issue_org }}</span>
              <span>{{ cert.issue_date }}</span>
            </div>
          </div>
          <van-tag type="success">有效</van-tag>
        </div>
        <div v-if="certificates.length === 0" class="empty-state">
          <van-icon name="certificate" size="48" />
          <div>暂无证书信息</div>
        </div>
      </div>
    </div>

    <div v-else-if="normalizedServiceCode === 'medical_record'" class="service-content">
      <div class="card">
        <div class="card-title">异地就医备案</div>
        <p class="service-intro">提交备案后可在跨省定点医疗机构直接结算，系统会同步生成服务记录。</p>
        <van-cell-group inset>
          <van-cell title="备案人" :value="serviceInfo.name || '本人'" />
          <van-cell title="备案类型" value="跨省异地长期居住人员" />
          <van-cell title="办理状态" value="可在线提交" />
        </van-cell-group>
        <van-button block type="primary" @click="router.push('/profile/records')">查看办理记录</van-button>
      </div>
    </div>

    <div v-else-if="normalizedServiceCode === 'social_transfer'" class="service-content">
      <div class="card">
        <div class="card-title">社保关系转移</div>
        <p class="service-intro">支持养老、医疗等社保关系跨地区转入转出进度查询。</p>
        <van-cell-group inset>
          <van-cell title="当前属地" value="北京市" />
          <van-cell title="预计办结" value="15 个工作日" />
          <van-cell title="状态查询" value="可用" />
        </van-cell-group>
        <van-button block type="primary" @click="router.push('/profile/records')">查看转移记录</van-button>
      </div>
    </div>

    <div v-else-if="normalizedServiceCode === 'labor_report'" class="service-content">
      <div class="card">
        <div class="card-title">劳动权益保障</div>
        <p class="service-intro">提交欠薪、社保缴纳、劳动合同等维权线索，后台审计将记录办理进度。</p>
        <van-cell-group inset>
          <van-cell title="受理范围" value="工资社保、劳动合同、职业伤害" />
          <van-cell title="办理时限" value="7 个工作日内反馈" />
          <van-cell title="进度查询" value="消息中心同步通知" />
        </van-cell-group>
        <van-button block type="primary" @click="router.push('/profile/records')">查看我的提交</van-button>
      </div>
    </div>

    <div v-else class="service-content">
      <div class="card">
        <div class="card-title">服务说明</div>
        <p class="service-intro">
          该服务正在建设中，敬请期待。您可以继续使用其他已开通的服务。
        </p>
        <van-button block type="primary" @click="router.back()">返回</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showSuccessToast } from 'vant';
import { getServices, pensionVerify, unemploymentApply, getCertificates, submitVerifyCode } from '@/api/services';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const serviceCode = route.params.code;
const todoId = route.query.todoId;

const normalizeServiceCode = (code) => {
  const aliases = {
    unemployment_apply: 'unemployment',
    certificate_query: 'cert_query',
  };
  return aliases[code] || code;
};
const normalizedServiceCode = normalizeServiceCode(serviceCode);

const isCrossProvince = computed(() => {
  const crossProvinceServices = ['medical_record', 'social_transfer', 'unemployment'];
  return crossProvinceServices.includes(normalizedServiceCode);
});

const serviceInfo = ref({ name: '', icon: '服', category: '', description: '', province: 'national' });
const verifying = ref(false);
const lastVerify = ref(null);
const certificates = ref([]);
const showReasonPicker = ref(false);
const showVerifyDialog = ref(false);
const verifyCode = ref('');
const pendingOperation = ref(null);

const unemploymentForm = ref({
  reason: '',
  bank_card: '',
  contact: '',
});

const reasonOptions = [
  { text: '劳动合同期满', value: 'contract_expire' },
  { text: '用人单位解除劳动合同', value: 'employer_terminate' },
  { text: '本人意愿中断就业', value: 'voluntary' },
  { text: '其他原因', value: 'other' },
];

const getIconBg = (category) => {
  const colors = {
    '养老': 'linear-gradient(135deg, #ff9a9e, #fecfef)',
    '医疗': 'linear-gradient(135deg, #a8edea, #fed6e3)',
    '社保': 'linear-gradient(135deg, #667eea, #764ba2)',
    '失业': 'linear-gradient(135deg, #f093fb, #f5576c)',
    '证书': 'linear-gradient(135deg, #4facfe, #00f2fe)',
    '维权': 'linear-gradient(135deg, #43e97b, #38f9d7)',
    '就业': 'linear-gradient(135deg, #fa709a, #fee140)',
  };
  return colors[category] || 'linear-gradient(135deg, #667eea, #764ba2)';
};

const getServiceMark = (category) => {
  const marks = {
    '养老': '养',
    '医疗': '医',
    '社保': '保',
    '失业': '业',
    '证书': '证',
    '维权': '权',
    '就业': '就',
  };
  return marks[category] || '服';
};

const onReasonConfirm = ({ selectedOptions }) => {
  unemploymentForm.value.reason = selectedOptions[0].text;
  showReasonPicker.value = false;
};

const doPensionVerify = async () => {
  verifying.value = true;
  try {
    const res = await pensionVerify({ verify_method: 'face' });
    if (res.code === 202 && res.data.require_verify) {
      pendingOperation.value = {
        operation: 'pension_verify',
        data: { verify_method: 'face' },
      };
      showVerifyDialog.value = true;
      verifying.value = false;
    } else if (res.code === 200) {
      showSuccessToast('认证成功');
      lastVerify.value = { verify_date: new Date().toISOString().split('T')[0], verify_method: 'face', verify_result: 'success' };
      verifying.value = false;
    } else {
      showToast(res.message || '认证失败');
      verifying.value = false;
    }
  } catch (e) {
    verifying.value = false;
  }
};

const submitUnemployment = async () => {
  const res = await unemploymentApply(unemploymentForm.value);
  if (res.code === 202 && res.data.require_verify) {
    pendingOperation.value = {
      operation: 'unemployment_apply',
      data: unemploymentForm.value,
    };
    showVerifyDialog.value = true;
  } else if (res.code === 200) {
    showSuccessToast('申请提交成功');
    setTimeout(() => router.back(), 1500);
  }
};

const confirmVerify = async () => {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    showToast('请输入6位验证码');
    return;
  }
  
  const testCodes = ['123456', '000000', '111111'];
  if (!testCodes.includes(verifyCode.value)) {
    showToast('验证码错误，测试验证码：123456');
    return;
  }

  try {
    let res;
    if (pendingOperation.value.operation === 'pension_verify') {
      res = await submitVerifyCode(verifyCode.value, 'pension/verify', pendingOperation.value.data);
    } else if (pendingOperation.value.operation === 'unemployment_apply') {
      res = await submitVerifyCode(verifyCode.value, 'unemployment/apply', {
        ...pendingOperation.value.data,
        reason: unemploymentForm.value.reason,
      });
    }
    
    if (res.code === 200) {
      showSuccessToast('操作成功');
      showVerifyDialog.value = false;
      verifyCode.value = '';
      if (pendingOperation.value.operation === 'pension_verify') {
        lastVerify.value = { verify_date: new Date().toISOString().split('T')[0], verify_method: 'face', verify_result: 'success' };
      } else {
        setTimeout(() => router.back(), 1500);
      }
    } else {
      showToast(res.message || '验证失败');
    }
  } catch (e) {
    showToast('验证失败');
  }
};

const loadData = async () => {
  const servicesRes = await getServices();
  if (servicesRes.code === 200) {
    const service = servicesRes.data.list.find(s => s.code === normalizedServiceCode || s.code === serviceCode);
    if (service) serviceInfo.value = service;
  }

  if (normalizedServiceCode === 'cert_query') {
    const certRes = await getCertificates();
    if (certRes.code === 200) certificates.value = certRes.data;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.service-detail-page {
  background-color: #f7f8fa;
}

.service-header {
  text-align: center;
  padding: 30px 20px;
  background: #fff;
}

.service-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 16px;
}

.service-title {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.service-desc {
  font-size: 13px;
  color: #969799;
}

.service-meta {
  background: #fff;
  margin: 0 16px 16px;
  padding: 12px 16px;
  border-radius: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: #646566;
  border-bottom: 1px solid #ebedf0;
}

.meta-item:last-child {
  border-bottom: none;
}

.meta-item.todo-source {
  background: #fff7e6;
  margin: 8px -16px -12px;
  padding: 10px 16px;
  border-radius: 0 0 12px 12px;
  border-bottom: none;
  color: #ff976a;
}

.verify-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #e8f3ff;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #1989fa;
}

.face-area {
  width: 240px;
  height: 240px;
  margin: 0 auto 24px;
  border: 3px dashed #1989fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.face-placeholder {
  text-align: center;
}

.face-icon {
  font-size: 80px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.face-text {
  font-size: 13px;
  color: #969799;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.record-date {
  font-size: 15px;
  color: #323233;
  margin-bottom: 4px;
}

.record-method {
  font-size: 12px;
  color: #969799;
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #ebedf0;
}

.cert-item:last-child {
  border-bottom: none;
}

.cert-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.cert-info {
  flex: 1;
}

.cert-name {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
}

.cert-level {
  font-size: 12px;
  color: #1989fa;
  margin-bottom: 4px;
}

.cert-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.service-intro {
  font-size: 14px;
  color: #646566;
  line-height: 1.8;
  margin-bottom: 20px;
}

.verify-dialog {
  padding: 24px;
}

.verify-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
}

.verify-desc {
  font-size: 13px;
  color: #969799;
  text-align: center;
  margin-bottom: 20px;
}

.verify-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.verify-actions .van-button {
  flex: 1;
}
</style>
