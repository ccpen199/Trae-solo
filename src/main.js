import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { showToast } from 'vant'
import router from './router'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.globalProperties.showToast = showToast

app.mount('#app')
