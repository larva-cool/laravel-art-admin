import { AppRouteRecord } from '@/types/router'

export const exceptionRoutes: AppRouteRecord = {
  path: '/exception',
  name: 'Exception',
  component: '/index/index',
  meta: {
    title: 'menus.exception.title',
    icon: 'ri:error-warning-line'
  },
  children: [
    {
      path: '403',
      name: 'Exception403',
      component: '/exception/403',
      meta: {
        title: 'menus.exception.forbidden',
        keep_alive: true,
        is_hide_tab: true,
        is_full_page: true
      }
    },
    {
      path: '404',
      name: 'Exception404',
      component: '/exception/404',
      meta: {
        title: 'menus.exception.notFound',
        keep_alive: true,
        is_hide_tab: true,
        is_full_page: true
      }
    },
    {
      path: '500',
      name: 'Exception500',
      component: '/exception/500',
      meta: {
        title: 'menus.exception.serverError',
        keep_alive: true,
        is_hide_tab: true,
        is_full_page: true
      }
    }
  ]
}
