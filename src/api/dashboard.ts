import request from '@/utils/http'

// ========== 数据概览（Dashboard） ==========

/** 统计卡片数据 */
export interface DashboardCards {
  total_users: number
  today_new_users: number
  today_active_users: number
  range_new_users: number
  new_users_change: number
  total_admins: number
  active_admins: number
  range_logins: number
  today_logins: number
}

/** 用户增长趋势数据点 */
export interface UserTrendPoint {
  date: string
  new: number
  total: number
  active: number
}

/** 登录趋势数据点 */
export interface LoginTrendPoint {
  date: string
  count: number
}

/** 最近注册用户 */
export interface NewUserItem {
  id: number
  username: string
  avatar: string | null
  created_at: string | null
}

/** 最近登录记录 */
export interface RecentLoginItem {
  guard: string
  user_id: number
  ip: string
  address: string | null
  platform: string | null
  device: string | null
  login_at: string | null
}

/** Dashboard 统计响应 */
export interface DashboardStatsResponse {
  cards: DashboardCards
  user_trend: UserTrendPoint[]
  login_trend: LoginTrendPoint[]
  new_users: NewUserItem[]
  recent_logins: RecentLoginItem[]
}

// ----- API 方法 -----

/** 获取数据概览 */
export function fetchDashboardStats(params?: { days?: number }) {
  return request.get<DashboardStatsResponse>({ url: '/admin/dashboard/stats', params })
}
