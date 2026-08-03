import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line'
  },
  children: [
    {
      path: 'admin',
      name: 'Admin',
      component: '/system/admin',
      meta: {
        title: 'menus.system.admin',
        keep_alive: true
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        keep_alive: true
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        is_hide: true,
        keep_alive: true,
        is_hide_tab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        keep_alive: true,
        auth_list: [
          { title: '新增', auth_mark: 'add' },
          { title: '编辑', auth_mark: 'edit' },
          { title: '删除', auth_mark: 'delete' }
        ]
      }
    }
  ]
}
