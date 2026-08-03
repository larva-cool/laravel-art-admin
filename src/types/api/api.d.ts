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
      /** 状态枚举 {value: 0|1, label: string} */
      status: { value: number; label: string }
      login_count: number
      last_login_ip: string | null
      last_login_at: string | null
      last_active_at: string | null
      /** 角色名称数组（whenLoaded） */
      roles?: string[]
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
      status?: number
    }

    /** 角色列表（Laravel 分页） */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项（RoleResource） */
    interface RoleListItem {
      id: number
      name: string
      created_at: string | null
      updated_at: string | null
    }

    /** 角色保存参数（创建/编辑） */
    interface RoleSaveParams {
      name: string
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
  }
}
