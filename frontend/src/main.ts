import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import {
  Tabbar,
  TabbarItem,
  NavBar,
  Cell,
  CellGroup,
  Field,
  Button,
  Toast,
  Dialog,
  Empty,
  PullRefresh,
  List,
  Swipe,
  SwipeItem,
  Tag,
  Progress,
  Checkbox,
  Icon
} from 'vant'
import 'vant/lib/index.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Tabbar)
app.use(TabbarItem)
app.use(NavBar)
app.use(Cell)
app.use(CellGroup)
app.use(Field)
app.use(Button)
app.use(Toast)
app.use(Dialog)
app.use(Empty)
app.use(PullRefresh)
app.use(List)
app.use(Swipe)
app.use(SwipeItem)
app.use(Tag)
app.use(Progress)
app.use(Checkbox)
app.use(Icon)

app.mount('#app')

app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
}

