import { AppRouteRecord } from '@/types/router'
import request from '@/utils/http'

// ========== 管理员管理 ==========

// 获取管理员列表（分页）
export function fetchGetAdminList(params: Api.SystemManage.AdminSearchParams) {
  return request.get<Api.SystemManage.AdminList>({
    url: '/admin/admins',
    params
  })
}

// 获取管理员详情
export function fetchGetAdminDetail(id: number) {
  return request.get<Api.SystemManage.AdminListItem>({
    url: `/admin/admins/${id}`
  })
}

// 创建管理员
export function fetchCreateAdmin(data: Api.SystemManage.AdminCreateParams) {
  return request.post<Api.SystemManage.AdminListItem>({
    url: '/admin/admins',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

// 更新管理员
export function fetchUpdateAdmin(id: number, data: Api.SystemManage.AdminUpdateParams) {
  return request.put<Api.SystemManage.AdminListItem>({
    url: `/admin/admins/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除管理员
export function fetchDeleteAdmin(id: number) {
  return request.del<null>({
    url: `/admin/admins/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

// 启用/禁用管理员
export function fetchToggleAdminStatus(id: number) {
  return request.put<Api.SystemManage.AdminListItem>({
    url: `/admin/admins/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

// 重置管理员密码
export function fetchResetAdminPassword(id: number, password: string) {
  return request.put<null>({
    url: `/admin/admins/${id}/reset-password`,
    data: { password, password_confirmation: password },
    showSuccessMessage: true,
    successMessage: '密码重置成功'
  })
}

// 获取管理员已分配角色
export function fetchGetAdminRoles(id: number) {
  return request.get<string[]>({
    url: `/admin/admins/${id}/roles`
  })
}

// 分配管理员角色
export function fetchAssignAdminRoles(id: number, roles: string[]) {
  return request.put<string[]>({
    url: `/admin/admins/${id}/roles`,
    data: { roles },
    showSuccessMessage: true,
    successMessage: '角色分配成功'
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

// ========== 配置管理 ==========

// 获取配置列表（分页）
export function fetchGetSettingList(params: Api.SystemManage.SettingSearchParams) {
  return request.get<Api.SystemManage.SettingList>({
    url: '/admin/settings',
    params
  })
}

// 获取配置详情
export function fetchGetSettingDetail(id: number) {
  return request.get<Api.SystemManage.SettingListItem>({
    url: `/admin/settings/${id}`
  })
}

// 创建配置
export function fetchCreateSetting(data: Api.SystemManage.SettingSaveParams) {
  return request.post<Api.SystemManage.SettingListItem>({
    url: '/admin/settings',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

// 更新配置
export function fetchUpdateSetting(id: number, data: Api.SystemManage.SettingSaveParams) {
  return request.put<Api.SystemManage.SettingListItem>({
    url: `/admin/settings/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除配置
export function fetchDeleteSetting(id: number) {
  return request.del<null>({
    url: `/admin/settings/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
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

// ========== 地区管理 ==========

// 获取地区树形结构
export function fetchGetAreaTree(params?: Api.SystemManage.AreaSearchParams) {
  return request.get<Api.SystemManage.AreaListItem[]>({
    url: '/admin/areas',
    params
  })
}

// 获取地区详情
export function fetchGetAreaDetail(id: number) {
  return request.get<Api.SystemManage.AreaListItem>({
    url: `/admin/areas/${id}`
  })
}

// 创建地区
export function fetchCreateArea(data: Api.SystemManage.AreaSaveParams) {
  return request.post<Api.SystemManage.AreaListItem>({
    url: '/admin/areas',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

// 更新地区
export function fetchUpdateArea(id: number, data: Api.SystemManage.AreaSaveParams) {
  return request.put<Api.SystemManage.AreaListItem>({
    url: `/admin/areas/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除地区
export function fetchDeleteArea(id: number) {
  return request.del<null>({
    url: `/admin/areas/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}
