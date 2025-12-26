import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/accounts' },
  { path: '/accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue') },
  { path: '/switch', name: 'Switch', component: () => import('@/views/SwitchView.vue') },
  { path: '/settings', name: 'Settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/tutorial', name: 'Tutorial', component: () => import('@/views/TutorialView.vue') }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
