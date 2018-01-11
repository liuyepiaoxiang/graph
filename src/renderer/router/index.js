import Vue from 'vue'
import Router from 'vue-router'
import ElementUI from 'element-ui'
import _ from 'lodash'

Vue.use(Router)
Vue.use(ElementUI)
Vue.prototype._ = _

export default new Router({
  routes: [
    {
      path: '/',
      name: 'login',
      component: require('@/components/login')
    },
    {
      path: '/register',
      name: 'register',
      component: require('@/components/register')
    },
    {
      path: '/home',
      component: require('@/components/home'),
      children: [
        {
          path: '',
          redirect: '/home/data'
        },
        {
          path: '/data',
          name: 'data',
          component: require('@/components/dataDeal/dataDeal.vue')
        },
        {
          path: '/suggest',
          name: 'suggest',
          component: require('@/components/suggest/suggest.vue')
        },
        {
          path: '/support',
          name: 'support',
          component: require('@/components/support/support.vue')
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
