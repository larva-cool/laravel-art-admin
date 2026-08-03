import { AppRouteRecord } from '@/types/router'
import request from '@/utils/http'

// ========== 管理员管理 ==========

// 获取管理员列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/admin/admins',
    params
  })
}

// ========== 角色管理 ==========

// 获取角色列表（分页）
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/admin/roles',
    params
  })
}

// 获取全部权限（用于权限分配）
export function fetchGetAllPermissions() {
  return request.get<Api.SystemManage.PermissionItem[]>({
    url: '/admin/roles/permissions'
  })
}

// 获取角色详情
export function fetchGetRoleDetail(id: number) {
  return request.get<Api.SystemManage.RoleListItem>({
    url: `/admin/roles/${id}`
  })
}

// 获取角色已分配的权限 ID 列表
export function fetchGetRolePermissions(id: number) {
  return request.get<number[]>({
    url: `/admin/roles/${id}/permissions`
  })
}

// 创建角色
export function fetchCreateRole(data: Api.SystemManage.RoleSaveParams) {
  return request.post<Api.SystemManage.RoleListItem>({
    url: '/admin/roles',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

// 更新角色
export function fetchUpdateRole(id: number, data: Api.SystemManage.RoleSaveParams) {
  return request.put<Api.SystemManage.RoleListItem>({
    url: `/admin/roles/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除角色
export function fetchDeleteRole(id: number) {
  return request.del<null>({
    url: `/admin/roles/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

// 分配角色权限
export function fetchAssignRolePermissions(id: number, permissionIds: number[]) {
  return request.put<number[]>({
    url: `/admin/roles/${id}/permissions`,
    data: { permissions: permissionIds },
    showSuccessMessage: true,
    successMessage: '权限分配成功'
  })
}

// ========== 菜单管理 ==========

// 获取完整菜单树（包含目录/菜单/按钮，供菜单管理和权限分配使用）
export function fetchGetMenuTree() {
  return request.get<Api.SystemManage.MenuTreeItem[]>({
    url: '/admin/menus/tree'
  })
}

// 获取前端路由配置（后端按当前管理员角色过滤，返回 AppRouteRecord[] 格式）
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/admin/menus/routes'
  })
}
