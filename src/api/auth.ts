import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数（account 支持用户名/邮箱/手机号）
 * @returns { access_token, user }
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/admin/auth/login',
    params
  })
}

/**
 * 获取当前登录用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.AdminInfo>({
    url: '/admin/auth/info'
  })
}

/**
 * 退出登录（后端吊销当前 token）
 */
export function fetchLogout() {
  return request.post<void>({
    url: '/admin/auth/logout'
  })
}
