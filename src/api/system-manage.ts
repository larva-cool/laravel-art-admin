import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取前端路由配置（后端按当前管理员角色过滤，返回 AppRouteRecord[] 格式）
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/admin/menus/routes'
  })
}
