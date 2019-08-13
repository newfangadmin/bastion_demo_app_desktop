import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import '@/styles/index.scss' // global css
import ElementUI from 'element-ui'

import userDB from './userData'
import fileDB from './fileData'

Vue.use(ElementUI)

Vue.use(require('vue-moment'))

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.prototype.$udb = userDB
Vue.prototype.$db = fileDB

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
