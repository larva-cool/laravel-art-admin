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
      roles: string[]
      buttons: string[]
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      username: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

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
  }
}
