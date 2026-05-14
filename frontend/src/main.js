import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Button, Tabbar, TabbarItem, NavBar, Icon, Swipe, SwipeItem, Search, Card, Stepper, Checkbox, Form, Field, Cell, CellGroup, Popup, ActionSheet, Dialog, Toast } from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(router)
app.use(Button)
app.use(Tabbar)
app.use(TabbarItem)
app.use(NavBar)
app.use(Icon)
app.use(Swipe)
app.use(SwipeItem)
app.use(Search)
app.use(Card)
app.use(Stepper)
app.use(Checkbox)
app.use(Form)
app.use(Field)
app.use(Cell)
app.use(CellGroup)
app.use(Popup)
app.use(ActionSheet)
app.use(Dialog)
app.use(Toast)

app.mount('#app')