import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/index.less'
import { 
  Button, 
  Cell, 
  CellGroup, 
  Icon, 
  Image as VanImage,
  Loading,
  PullRefresh,
  List,
  Tabs,
  Tab,
  Toast,
  Dialog,
  Notify,
  Empty,
  Card,
  Tag,
  Divider,
  Popup,
  ActionSheet,
  Uploader,
  Field,
  Form,
  PasswordInput,
  NumberKeyboard,
  Search,
  NavBar,
  Tabbar,
  TabbarItem,
  Badge,
  Sidebar,
  SidebarItem,
  Grid,
  GridItem,
  IndexBar,
  IndexAnchor,
  Pagination,
  Steps,
  Step,
  Swipe,
  SwipeItem,
  CountDown,
  Progress,
  Circle,
  Collapse,
  CollapseItem
} from 'vant'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.use(Button)
app.use(Cell)
app.use(CellGroup)
app.use(Icon)
app.use(VanImage)
app.use(Loading)
app.use(PullRefresh)
app.use(List)
app.use(Tabs)
app.use(Tab)
app.use(Toast)
app.use(Dialog)
app.use(Notify)
app.use(Empty)
app.use(Card)
app.use(Tag)
app.use(Divider)
app.use(Popup)
app.use(ActionSheet)
app.use(Uploader)
app.use(Field)
app.use(Form)
app.use(PasswordInput)
app.use(NumberKeyboard)
app.use(Search)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Badge)
app.use(Sidebar)
app.use(SidebarItem)
app.use(Grid)
app.use(GridItem)
app.use(IndexBar)
app.use(IndexAnchor)
app.use(Pagination)
app.use(Steps)
app.use(Step)
app.use(Swipe)
app.use(SwipeItem)
app.use(CountDown)
app.use(Progress)
app.use(Circle)
app.use(Collapse)
app.use(CollapseItem)

app.mount('#app')
