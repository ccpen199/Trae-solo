import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

import App from './App.vue';
import router from './router';
import { useUserStore } from './store/user';

const app = createApp(App);

app.use(createPinia());

const userStore = useUserStore();
userStore.restore();

app.use(router);
app.use(ElementPlus, { locale: zhCn });

app.mount('#app');
