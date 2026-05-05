import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './utils/axios';

import {
  Button,
  Cell,
  CellGroup,
  Image as VanImage,
  Icon,
  NavBar,
  Tabbar,
  TabbarItem,
  Search,
  Swipe,
  SwipeItem,
  Grid,
  GridItem,
  List,
  PullRefresh,
  Toast,
  Dialog,
  Empty,
  Divider,
  Tag,
  Card,
  Stepper,
  SubmitBar,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Field,
  Form,
  Popup,
  Picker,
  Area,
  CountDown,
  Loading,
  Overlay,
  NoticeBar,
  ActionSheet,
  Badge
} from 'vant';
import 'vant/lib/index.css';
import './styles/global.less';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.use(Button);
app.use(Cell);
app.use(CellGroup);
app.use(VanImage);
app.use(Icon);
app.use(NavBar);
app.use(Tabbar);
app.use(TabbarItem);
app.use(Search);
app.use(Swipe);
app.use(SwipeItem);
app.use(Grid);
app.use(GridItem);
app.use(List);
app.use(PullRefresh);
app.use(Toast);
app.use(Dialog);
app.use(Empty);
app.use(Divider);
app.use(Tag);
app.use(Card);
app.use(Stepper);
app.use(SubmitBar);
app.use(Checkbox);
app.use(CheckboxGroup);
app.use(Radio);
app.use(RadioGroup);
app.use(Field);
app.use(Form);
app.use(Popup);
app.use(Picker);
app.use(Area);
app.use(CountDown);
app.use(Loading);
app.use(Overlay);
app.use(NoticeBar);
app.use(ActionSheet);
app.use(Badge);

app.mount('#app');
