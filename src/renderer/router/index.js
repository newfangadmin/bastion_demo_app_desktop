import Vue from 'vue'
import Router from 'vue-router'
import Base from '@/components/Base/'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: require('@/views/login/index').default
    },
    {
      path: '/signup',
      name: 'Signup',
      component: require('@/views/login/signup').default
    },
    {
      path: '/home/:fid, :parentId',
      redirect: '/home',
      component: Base,
      children: [
        {
          path: 'home',
          name: 'Home',
          component: require('@/views/home/index').default
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
