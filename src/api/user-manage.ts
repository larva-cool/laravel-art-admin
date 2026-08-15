import request from '@/utils/http'

// ========== 用户管理（前台用户） ==========

// 获取用户列表（分页）
export function fetchGetUserList(params: Api.UserManage.UserSearchParams) {
  return request.get<Api.UserManage.UserList>({
    url: '/admin/users',
    params
  })
}

// 获取用户详情
export function fetchGetUserDetail(id: number) {
  return request.get<Api.UserManage.UserDetail>({
    url: `/admin/users/${id}`
  })
}

// 更新用户
export function fetchUpdateUser(id: number, data: Api.UserManage.UserUpdateParams) {
  return request.put<Api.UserManage.UserListItem>({
    url: `/admin/users/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除用户（软删除）
export function fetchDeleteUser(id: number) {
  return request.del<null>({
    url: `/admin/users/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

// 冻结/启用用户
export function fetchToggleUserStatus(id: number) {
  return request.put<Api.UserManage.UserListItem>({
    url: `/admin/users/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

// 重置用户密码
export function fetchResetUserPassword(id: number, password: string) {
  return request.put<null>({
    url: `/admin/users/${id}/reset-password`,
    data: { password, password_confirmation: password },
    showSuccessMessage: true,
    successMessage: '密码重置成功'
  })
}

// 重置用户联系方式（邮箱/手机号）
export function fetchResetUserContact(id: number, data: Api.UserManage.ResetContactParams) {
  return request.put<null>({
    url: `/admin/users/${id}/reset-contact`,
    data,
    showSuccessMessage: true,
    successMessage: '重置成功'
  })
}

// 调整用户余额（积分/金币）
export function fetchAdjustUserBalance(id: number, data: Api.UserManage.AdjustBalanceParams) {
  return request.put<Api.UserManage.UserListItem>({
    url: `/admin/users/${id}/adjust-balance`,
    data,
    showSuccessMessage: true,
    successMessage: '余额调整成功'
  })
}

// 延长用户 VIP
export function fetchExtendUserVip(id: number, data: Api.UserManage.ExtendVipParams) {
  return request.put<Api.UserManage.UserListItem>({
    url: `/admin/users/${id}/extend-vip`,
    data,
    showSuccessMessage: true,
    successMessage: 'VIP延长成功'
  })
}

// 获取用户登录历史（分页）
export function fetchUserLoginHistories(
  id: number | string,
  params?: Api.Common.LaravelPaginationRequest & {
    keyword?: string
    login_start?: string
    login_end?: string
  }
) {
  return request.get<Api.UserManage.LoginHistoryList>({
    url: `/admin/users/${id}/login-histories`,
    params
  })
}
