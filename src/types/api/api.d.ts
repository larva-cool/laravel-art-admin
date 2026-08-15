/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.AdminInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页状态（内部 UI 状态，绑定 ElPagination） */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 分页请求参数（Laravel 格式：发送给后端的参数名） */
    interface LaravelPaginationRequest {
      /** 当前页码 */
      page: number
      /** 每页条数 */
      per_page: number
    }

    /** 分页响应（Laravel 分页 JSON 结构） */
    interface PaginatedResponse<T = any> {
      data: T[]
      links?: Record<string, string | null>
      meta: {
        current_page: number
        per_page: number
        total: number
        last_page?: number
        from?: number
        to?: number
        [key: string]: any
      }
    }

    /** 通用搜索参数（继承 Laravel 分页请求参数） */
    type CommonSearchParams = LaravelPaginationRequest

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数（后端接收 account 字段，支持用户名/邮箱/手机号登录） */
    interface LoginParams {
      account: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      access_token: string
      user: AdminInfo
    }

    /** 管理员信息（对齐后端 AdminInfoResource） */
    interface AdminInfo {
      user_id: number
      user_name: string
      email: string
      avatar: string
      phone?: string
      roles: string[]
      buttons: string[]
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 管理员列表（Laravel 分页） */
    type AdminList = Api.Common.PaginatedResponse<AdminListItem>

    /** 管理员列表项（AdminResource） */
    interface AdminListItem {
      id: number
      username: string
      email: string | null
      phone: string | null
      name: string
      avatar: string | null
      /** 状态枚举 {value: 0|1, label: string} */
      status: { value: number; label: string }
      login_count: number
      last_login_ip: string | null
      last_login_at: string | null
      last_active_at: string | null
      /** 角色信息数组（whenLoaded） */
      roles?: { name: string; display_name: string }[]
      created_at: string | null
      updated_at: string | null
    }

    /** 管理员创建参数 */
    interface AdminCreateParams {
      username: string
      email?: string | null
      phone?: string | null
      name: string
      password: string
      status: number
      roles?: string[]
    }

    /** 管理员更新参数 */
    interface AdminUpdateParams {
      email?: string | null
      phone?: string | null
      name: string
      password?: string | null
      status: number
      roles?: string[]
    }

    /** 管理员搜索参数 */
    interface AdminSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      role?: string
      status?: number
      last_login_ip?: string
      last_login_start?: string
      last_login_end?: string
    }

    /** 管理员登录历史列表（Laravel 分页） */
    type AdminLoginHistoryList = Api.Common.PaginatedResponse<AdminLoginHistoryItem>

    /** 管理员登录历史项（LoginHistoryResource） */
    interface AdminLoginHistoryItem {
      id: number
      ip: string
      port: number | null
      platform: string | null
      device: string | null
      browser: string | null
      user_agent: string | null
      address: string | null
      login_at: string | null
    }

    /** 管理员登录历史查询参数 */
    interface AdminLoginHistoryParams extends Api.Common.CommonSearchParams {
      keyword?: string
      login_start?: string
      login_end?: string
    }

    /** 角色列表（Laravel 分页） */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项（RoleResource） */
    interface RoleListItem {
      id: number
      name: string
      display_name: string
      permissions_count?: number
      created_at: string | null
      updated_at: string | null
    }

    /** 角色保存参数（创建/编辑） */
    interface RoleSaveParams {
      name: string
      display_name: string
      permissions?: number[]
    }

    /** 权限项 */
    interface PermissionItem {
      id: number
      name: string
      display_name: string
    }

    /** 角色搜索参数 */
    interface RoleSearchParams extends Api.Common.CommonSearchParams {
      role_name?: string
      display_name?: string
    }

    /** 配置列表（Laravel 分页） */
    type SettingList = Api.Common.PaginatedResponse<SettingListItem>

    /** 配置列表项（SettingResource） */
    interface SettingListItem {
      id: number
      name: string
      key: string
      value: string | null
      cast_type: string
      input_type: string
      param: string | null
      sort: number
      remark: string | null
      updated_at: string | null
    }

    /** 配置保存参数（创建/编辑） */
    interface SettingSaveParams {
      name: string
      key: string
      value?: string | null
      cast_type: string
      input_type: string
      param?: string | null
      sort?: number
      remark?: string | null
    }

    /** 配置搜索参数 */
    interface SettingSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      cast_type?: string
    }

    /** 配置项元数据（分组接口返回） */
    interface SettingGroupItem {
      name: string
      key: string
      field: string
      value: string | number | boolean | null
      cast_type: string
      input_type: string
      param: Record<string, any> | null
      remark: string | null
      sort: number
    }

    /** 配置分组 */
    interface SettingGroup {
      key: string
      title: string
      items: SettingGroupItem[]
    }

    /** 分组配置响应 */
    interface SettingGroupsResponse {
      groups: SettingGroup[]
      disks: string[]
    }

    /** 地区列表项（AreaResource） */
    interface AreaListItem {
      id: number
      parent_id: number | null
      name: string
      area_code: number | null
      lat: number | null
      lng: number | null
      city_code: string | null
      sort: number
      created_at: string | null
      updated_at: string | null
      children?: AreaListItem[]
    }

    /** 地区保存参数（创建/编辑） */
    interface AreaSaveParams {
      parent_id?: number | null
      name: string
      area_code?: number | null
      lat?: number | null
      lng?: number | null
      city_code?: string | null
      sort?: number
    }

    /** 地区搜索参数 */
    interface AreaSearchParams {
      name?: string
      parent_id?: string
    }

    /** 菜单类型枚举值 */
    type MenuTypeValue = 0 | 1 | 2 | 3 | 4

    /** 菜单树节点（/admin/menus/tree 返回） */
    interface MenuTreeItem {
      id: number
      parent_id: number | null
      path: string | null
      name: string | null
      component: string | null
      redirect: string | null
      title: string
      icon: string | null
      link: string | null
      type: { value: MenuTypeValue; label: string }
      sort: number
      is_enable: boolean
      is_hide: boolean
      is_hide_tab: boolean
      is_iframe: boolean
      keep_alive: boolean
      is_full_page: boolean
      fixed_tab: boolean
      show_badge: boolean
      show_text_badge: string | null
      active_path: string | null
      permission: string | null
      children?: MenuTreeItem[]
    }

    /** 菜单保存参数（创建/编辑） */
    interface MenuSaveParams {
      parent_id?: number | null
      path?: string | null
      name?: string | null
      component?: string | null
      redirect?: string | null
      title: string
      icon?: string | null
      link?: string | null
      type: MenuTypeValue
      sort: number
      is_enable: boolean
      is_hide: boolean
      is_hide_tab: boolean
      is_iframe: boolean
      keep_alive: boolean
      is_full_page: boolean
      fixed_tab: boolean
      show_badge: boolean
      show_text_badge?: string | null
      active_path?: string | null
      permission?: string | null
    }

    /** 短信验证码列表（Laravel 分页） */
    type PhoneCodeList = Api.Common.PaginatedResponse<PhoneCodeListItem>

    /** 短信验证码列表项（PhoneCodeResource） */
    interface PhoneCodeListItem {
      id: number
      phone: string
      scene: string
      code: string
      ip: string | null
      /** 状态枚举 {value: 0|1, label: string} */
      state: { value: number; label: string }
      send_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 短信验证码搜索参数 */
    interface PhoneCodeSearchParams extends Api.Common.CommonSearchParams {
      phone?: string
      scene?: string
      state?: number
    }

    /** 邮件验证码列表（Laravel 分页） */
    type MailCodeList = Api.Common.PaginatedResponse<MailCodeListItem>

    /** 邮件验证码列表项（MailCodeResource） */
    interface MailCodeListItem {
      id: number
      email: string
      scene: string
      code: string
      ip: string | null
      /** 状态枚举 {value: 0|1, label: string} */
      state: { value: number; label: string }
      send_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 邮件验证码搜索参数 */
    interface MailCodeSearchParams extends Api.Common.CommonSearchParams {
      email?: string
      state?: number
    }
  }

  /** 用户管理模块（前台用户） */
  namespace UserManage {
    /** 用户列表（分页） */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户登录历史列表 */
    type LoginHistoryList = Api.Common.PaginatedResponse<LoginHistoryItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      username: string
      email: string | null
      phone: string | null
      name: string
      avatar: string | null
      /** 状态枚举 { value, label } */
      status: { value: number; label: string }
      available_points: number
      available_coins: number
      login_count: number
      last_login_ip: string | null
      vip_expires_at: string | null
      is_vip: boolean
      last_login_at: string | null
      last_active_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 用户详情（含 profile） */
    interface UserDetail extends UserListItem {
      profile?: UserProfile
    }

    /** 用户资料 */
    interface UserProfile {
      gender: { value: number; label: string } | null
      birthday: string | null
      province_id: number | null
      city_id: number | null
      district_id: number | null
      website: string | null
      intro: string | null
      bio: string | null
    }

    /** 登录历史项 */
    interface LoginHistoryItem {
      id: number
      ip: string
      address: string | null
      device: string | null
      browser: string | null
      platform: string | null
      login_at: string | null
    }

    /** 更新用户参数 */
    interface UserUpdateParams {
      username?: string
      email?: string | null
      phone?: string | null
      name?: string
      status?: number
    }

    /** 调整余额参数 */
    interface AdjustBalanceParams {
      /** points=积分, coins=金币 */
      type: 'points' | 'coins'
      /** 正数增加，负数减少 */
      amount: number
      /** 描述/备注 */
      description?: string
    }

    /** 延长 VIP 参数 */
    interface ExtendVipParams {
      days: number
    }

    /** 重置密码参数 */
    interface ResetPasswordParams {
      password: string
    }

    /** 重置联系方式参数 */
    interface ResetContactParams {
      type: 'email' | 'phone'
      value: string
    }

    /** 用户搜索参数 */
    interface UserSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: number
      /** 1=VIP, 0=非VIP */
      vip?: string
      /** 最后登录开始日期 YYYY-MM-DD */
      login_start?: string
      /** 最后登录结束日期 */
      login_end?: string
      /** 注册开始日期 */
      register_start?: string
      /** 注册结束日期 */
      register_end?: string
    }
  }

  /** AI 聊天模块 */
  namespace Chat {
    /** 发送消息参数 */
    interface SendParams {
      /** 用户消息内容 */
      prompt: string
      /** 会话 ID（新对话不传，继续对话时传入） */
      conversation_id?: string | null
    }

    /** 发送消息响应（同步模式） */
    interface SendResponse {
      /** 会话 ID（新对话时返回新建 ID） */
      conversation_id: string
      /** AI 完整回复 */
      reply: string
      /** Token 用量 */
      usage: {
        input_tokens: number
        output_tokens: number
      }
    }

    /** 会话列表分页参数 */
    type ConversationListParams = Api.Common.LaravelPaginationRequest

    /** 会话列表项 */
    interface ConversationItem {
      id: string
      title: string
      messages_count?: number
      created_at: string | null
      updated_at: string | null
    }

    /** 会话列表响应（Laravel 分页） */
    type ConversationListResponse = Api.Common.PaginatedResponse<ConversationItem>

    /** 会话消息项 */
    interface MessageItem {
      id: string
      /** user 用户，assistant AI */
      role: 'user' | 'assistant'
      content: string
      created_at: string | null
      /** 工具调用记录（assistant 消息可能包含） */
      tool_calls?: Array<{
        id: string
        name: string
        arguments: Record<string, unknown>
      }> | null
      /** 工具调用结果 */
      tool_results?: Array<{
        id: string
        name: string
        result: unknown
        successful: boolean
        denied?: boolean
        error?: string | null
      }> | null
    }

    /** 会话详情 */
    interface ConversationDetail {
      id: string
      title: string
      messages: MessageItem[]
      created_at: string | null
      updated_at: string | null
    }
  }

  /** 通知管理 */
  namespace Notification {
    /** 通知列表查询参数 */
    interface ListParams extends Api.Common.LaravelPaginationRequest {
      type?: string
    }

    /** 通知项 */
    interface NotificationItem {
      id: string
      type: string
      data: Record<string, unknown>
      read_at: string | null
      send_at: string
    }

    /** 通知列表响应 */
    type NotificationListResponse = Api.Common.PaginatedResponse<NotificationItem>

    /** 标记已读参数 */
    interface MarkReadParams {
      id: string
    }

    /** 审批参数 */
    interface ApprovalParams {
      conversation_id: string
      approval_id: string
      approved: boolean
      reason?: string
    }
  }
}
