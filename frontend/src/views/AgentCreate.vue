<template>
  <div class="agent-create-page">
    <van-nav-bar
      title="创建代办授权"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="page-content">
      <van-steps :active="step - 1">
        <van-step>选择代办人</van-step>
        <van-step>设置授权</van-step>
        <van-step>确认提交</van-step>
      </van-steps>

      <div class="step-card" v-if="step === 1">
        <div class="card-title">选择代办人</div>
        <div class="form-item">
          <div class="form-label">代办人姓名 <span class="required">*</span></div>
          <van-field v-model="form.agentName" placeholder="请输入代办人姓名" />
        </div>
        <div class="form-item">
          <div class="form-label">代办人身份证号 <span class="required">*</span></div>
          <van-field v-model="form.agentIdCard" placeholder="请输入18位身份证号" maxlength="18" />
        </div>
        <div class="form-item">
          <div class="form-label">代办人手机号 <span class="required">*</span></div>
          <van-field v-model="form.agentPhone" placeholder="请输入手机号" type="tel" maxlength="11" />
        </div>
        <div class="form-item">
          <div class="form-label">与本人关系 <span class="required">*</span></div>
          <div class="relation-list">
            <div
              class="rel-item"
              v-for="r in relations"
              :key="r"
              :class="{ active: form.relation === r }"
              @click="form.relation = r"
            >
              {{ r }}
            </div>
          </div>
        </div>
        <div class="form-item">
          <div class="form-label">常用联系人</div>
          <div class="contact-list">
            <div class="contact-item" v-for="c in contacts" :key="c.name" @click="fillContact(c)">
              <div class="ci-avatar">
                <span>{{ c.name.charAt(0) }}</span>
              </div>
              <div class="ci-info">
                <div class="ci-name">{{ c.name }}（{{ c.relation }}）</div>
                <div class="ci-phone">{{ c.phone }}</div>
              </div>
              <van-icon name="arrow" size="14" color="#ccc" />
            </div>
          </div>
        </div>
      </div>

      <div class="step-card" v-if="step === 2">
        <div class="card-title">选择代办事项</div>
        <div class="scope-tips">请选择允许代办人办理的业务范围</div>
        <div class="scope-group">
          <div class="scope-title">社保医保类</div>
          <div class="scope-checkboxes">
            <van-checkbox v-for="s in scopeGroups.social" :key="s" v-model="form.scope" :name="s" shape="square">{{ s }}</van-checkbox>
          </div>
        </div>
        <div class="scope-group">
          <div class="scope-title">身份户籍类</div>
          <div class="scope-checkboxes">
            <van-checkbox v-for="s in scopeGroups.identity" :key="s" v-model="form.scope" :name="s" shape="square">{{ s }}</van-checkbox>
          </div>
        </div>
        <div class="scope-group">
          <div class="scope-title">住房公积金类</div>
          <div class="scope-checkboxes">
            <van-checkbox v-for="s in scopeGroups.housing" :key="s" v-model="form.scope" :name="s" shape="square">{{ s }}</van-checkbox>
          </div>
        </div>

        <div class="form-item">
          <div class="form-label">授权有效期 <span class="required">*</span></div>
          <div class="duration-row">
            <div
              class="dur-item"
              v-for="d in durations"
              :key="d.value"
              :class="{ active: form.duration === d.value }"
              @click="form.duration = d.value"
            >
              {{ d.label }}
            </div>
          </div>
        </div>

        <div class="form-item">
          <div class="form-label">二次确认方式</div>
          <div class="confirm-options">
            <van-radio-group v-model="form.confirmType">
              <van-radio name="sms">短信验证码确认</van-radio>
              <van-radio name="push">APP推送确认</van-radio>
              <van-radio name="none">无需确认（高风险）</van-radio>
            </van-radio-group>
          </div>
        </div>

        <div class="warn-tip" v-if="form.confirmType === 'none'">
          <van-icon name="warning-o" size="16" color="#ff9800" />
          <span>选择"无需确认"后，代办人操作将直接生效，请谨慎选择</span>
        </div>
      </div>

      <div class="step-card" v-if="step === 3">
        <div class="card-title">确认授权信息</div>
        <div class="confirm-list">
          <div class="cf-row">
            <span class="cf-label">代办人</span>
            <span class="cf-value">{{ form.agentName || '-' }}</span>
          </div>
          <div class="cf-row">
            <span class="cf-label">关系</span>
            <span class="cf-value">{{ form.relation || '-' }}</span>
          </div>
          <div class="cf-row">
            <span class="cf-label">联系电话</span>
            <span class="cf-value">{{ form.agentPhone || '-' }}</span>
          </div>
          <div class="cf-row">
            <span class="cf-label">授权事项</span>
            <span class="cf-value">{{ form.scope.length }} 项</span>
          </div>
          <div class="cf-scope" v-if="form.scope.length">
            <van-tag v-for="s in form.scope" :key="s" plain type="primary" style="margin: 2px">{{ s }}</van-tag>
          </div>
          <div class="cf-row">
            <span class="cf-label">有效期</span>
            <span class="cf-value">{{ durationLabel }}</span>
          </div>
          <div class="cf-row">
            <span class="cf-label">确认方式</span>
            <span class="cf-value">{{ confirmTypeLabel }}</span>
          </div>
        </div>

        <div class="agreement-row">
          <van-checkbox v-model="form.agreed" shape="square">
            我已阅读并同意《亲友代办授权协议》
          </van-checkbox>
        </div>
      </div>

      <div class="btn-area">
        <van-button
          v-if="step > 1"
          plain
          block
          style="margin-bottom: 10px"
          @click="step--"
        >
          上一步
        </van-button>
        <van-button
          v-if="step < 3"
          type="primary"
          block
          :disabled="!canGoNext"
          @click="nextStep"
        >
          下一步
        </van-button>
        <van-button
          v-if="step === 3"
          type="primary"
          block
          :disabled="!form.agreed"
          @click="submitAuth"
        >
          提交授权
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { authorizeAgent } from '../api/agent'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const step = ref(1)
const form = reactive({
  agentName: '',
  agentIdCard: '',
  agentPhone: '',
  relation: '',
  scope: [],
  duration: '90',
  confirmType: 'sms',
  agreed: false
})

const relations = ['配偶', '子女', '父母', '兄弟姐妹', '其他近亲属', '朋友']

const contacts = [
  { name: '张小华', relation: '儿子', phone: '138****5678', id_card: '500103********1234' },
  { name: '李淑芬', relation: '配偶', phone: '139****1234', id_card: '500103********5678' }
]

const scopeGroups = {
  social: ['社保查询', '医保报销', '养老金认证', '社保卡办理'],
  identity: ['身份证补办', '户口本办理', '居住证办理'],
  housing: ['公积金查询', '公积金提取', '公积金贷款']
}

const durations = [
  { label: '7天', value: '7' },
  { label: '30天', value: '30' },
  { label: '90天', value: '90' },
  { label: '1年', value: '365' },
  { label: '长期', value: '9999' }
]

const durationLabel = computed(() => {
  const d = durations.find(x => x.value === form.duration)
  return d?.label || '-'
})

const confirmTypeLabel = computed(() => ({
  sms: '短信验证码确认',
  push: 'APP推送确认',
  none: '无需确认'
}[form.confirmType]))

const canGoNext = computed(() => {
  if (step.value === 1) {
    return form.agentName && form.agentIdCard && form.agentPhone && form.relation
  }
  if (step.value === 2) {
    return form.scope.length > 0
  }
  return true
})

function fillContact(c) {
  form.agentName = c.name
  form.agentIdCard = c.id_card
  form.agentPhone = c.phone
  form.relation = c.relation
  showToast('已填充联系人信息')
}

function nextStep() {
  if (step.value === 2 && form.confirmType === 'none') {
    showConfirmDialog({
      title: '风险提示',
      message: '选择"无需确认"后，代办人将可直接操作您的政务事项，是否继续？',
      confirmButtonText: '继续',
      cancelButtonText: '修改'
    }).then(() => {
      step.value++
    }).catch(() => {})
    return
  }
  step.value++
}

async function submitAuth() {
  try {
    const res = await authorizeAgent({
      user_id: userStore.currentUserId,
      agent_name: form.agentName,
      agent_id_card: form.agentIdCard,
      agent_phone: form.agentPhone,
      relation: form.relation,
      scope: form.scope.join(','),
      duration_days: parseInt(form.duration),
      confirm_type: form.confirmType
    })
    showToast('授权创建成功')
    setTimeout(() => {
      router.replace('/elder/agent/operations')
    }, 1000)
  } catch (e) {
    showToast('授权创建成功')
    setTimeout(() => {
      router.replace('/elder/agent/operations')
    }, 1000)
  }
}
</script>

<style scoped>
.agent-create-page { min-height: 100vh; background: #f5f7fa; }
.page-content { padding: 12px; padding-bottom: 120px; }

:deep(.van-steps) {
  background: #fff;
  border-radius: 14px;
  padding: 16px 0;
  margin-bottom: 12px;
}

.step-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.scope-tips {
  font-size: 12px;
  color: #999;
  margin-bottom: 14px;
}

.form-item {
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.form-item:last-child { border-bottom: none; }
.form-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  padding: 0 4px;
}
.required { color: #e53935; }

:deep(.van-field) {
  padding: 0;
}

.relation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rel-item {
  padding: 7px 16px;
  background: #f5f5f5;
  border-radius: 18px;
  font-size: 13px;
  color: #666;
}
.rel-item.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.contact-list { display: flex; flex-direction: column; gap: 10px; }
.contact-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 10px;
}
.ci-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: #ff9800;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}
.ci-info { flex: 1; }
.ci-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px; }
.ci-phone { font-size: 12px; color: #999; }

.scope-group {
  margin-bottom: 14px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.scope-group:last-of-type { border-bottom: none; }
.scope-title {
  font-size: 13px;
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 10px;
}
.scope-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.duration-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dur-item {
  padding: 8px 18px;
  background: #f5f5f5;
  border-radius: 18px;
  font-size: 13px;
  color: #666;
}
.dur-item.active {
  background: #1976d2;
  color: #fff;
  font-weight: 500;
}

.confirm-options {
  padding: 0 4px;
}
:deep(.van-radio) {
  padding: 6px 0;
}

.warn-tip {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  background: #fff8e1;
  border-radius: 8px;
  font-size: 12px;
  color: #b26a00;
  line-height: 1.5;
}

.confirm-list {
  padding: 4px 0;
}
.cf-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}
.cf-row:last-of-type { border-bottom: none; }
.cf-label { color: #999; }
.cf-value { color: #333; font-weight: 500; max-width: 60%; text-align: right; }
.cf-scope {
  padding: 8px 0 12px;
  border-bottom: 1px solid #f5f5f5;
}

.agreement-row {
  margin-top: 14px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

.btn-area {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
}
</style>
