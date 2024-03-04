

import { createRouter, createWebHistory } from 'vue-router'
import fastSiteCreator from '@/pages/fastSiteCreator.vue';

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [ {
    path: '/',
    name: 'Default',
    component: fastSiteCreator
  },

  {
    path: '/foto-map',
    name: 'Stories',
    component: fastSiteCreator,
  },
  {
      path: '/fastSiteCreator',
      name: 'FastSiteCreator',
      component: fastSiteCreator,
    },
  ],
})

export default router
