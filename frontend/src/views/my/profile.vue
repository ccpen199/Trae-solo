<template>
  <div class="page-container profile-page">
    <van-nav-bar
      title="个人资料"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    
    <div class="profile-form card-shadow">
      <van-field
        v-model="form.nickname"
        label="昵称"
        placeholder="请输入昵称"
      />
      <van-field
        v-model="form.phone"
        label="手机号"
        readonly
        disabled
      />
      <van-field
        v-model="form.gender"
        label="性别"
        placeholder="请选择性别"
        is-link
        readonly
        @click="showGenderPicker = true"
      />
      <van-field
        v-model="form.birthday"
        label="生日"
        placeholder="请选择生日"
        is-link
        readonly
        @click="showDatePicker = true"
      />
    </div>
    
    <div class="save-section">
      <van-button
        type="primary"
        class="save-btn"
        @click="saveProfile"
        :loading="saving"
      >
        保存
      </van-button>
    </div>
    
    <van-popup v-model:show="showGenderPicker" position="bottom">
      <van-picker
        :columns="genderColumns"
        @confirm="onGenderConfirm"
        @cancel="showGenderPicker = false"
      />
    </van-popup>
    
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="form.birthday"
        @confirm="showDatePicker = false"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import request from '../../utils/request';

const router = useRouter();
const saving = ref(false);
const showGenderPicker = ref(false);
const showDatePicker = ref(false);

const form = ref({
  nickname: '',
  phone: '',
  gender: 0,
  birthday: ''
});

const genderColumns = [
  { text: '保密', value: 0 },
  { text: '男', value: 1 },
  { text: '女', value: 2 }
];

function onGenderConfirm({ selectedOptions }) {
  form.value.gender = selectedOptions[0].value;
  showGenderPicker.value = false;
}

async function fetchProfile() {
  try {
    const res = await request.get('/user/profile');
    form.value = {
      ...res.data,
      gender: res.data.gender || 0
    };
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }
}

async function saveProfile() {
  try {
    saving.value = true;
    await request.put('/user/profile', form.value);
    showToast('保存成功');
    router.back();
  } catch (err) {
    console.error('保存失败:', err);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  fetchProfile();
});
</script>

<style lang="less" scoped>
.profile-page {
  .profile-form {
    margin: 16px;
    padding: 8px 0;
  }
  
  .save-section {
    padding: 20px 16px;
    
    .save-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 25px;
      height: 50px;
      font-size: 16px;
    }
  }
}
</style>
