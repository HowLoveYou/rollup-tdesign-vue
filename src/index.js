import Vue from 'vue';
import TDesign from 'tdesign-vue';
// 引入组件库全局样式资源
import 'tdesign-vue/es/style/index.css';
Vue.use(TDesign);

import Test from './components/test';
import HrSelectAsync from './components/hr-select-async';

function install(Vue) {
  Vue.use(Test);
  Vue.use(HrSelectAsync);
}
export { Hello, Test, HrSelectAsync };
export default install;
