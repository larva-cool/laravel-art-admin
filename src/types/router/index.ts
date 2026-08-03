/**
 * 路由类型定义模块
 *
 * 提供路由相关的类型定义
 *
 * ## 主要功能
 *
 * - 路由元数据类型（标题、图标、权限等）
 * - 应用路由记录类型
 * - 路由配置扩展
 *
 * ## 使用场景
 *
 * - 路由配置类型约束
 * - 路由元数据定义
 * - 菜单生成
 * - 权限控制
 *
 * @module types/router/index
 * @author Art Design Pro Team
 */

import { RouteRecordRaw } from 'vue-router'

/**
 * 路由元数据接口
 * 定义路由的各种配置属性
 */
export interface RouteMeta extends Record<string | number | symbol, unknown> {
  /** 路由标题 */
  title: string
  /** 路由图标 */
  icon?: string
  /** 是否显示徽章 */
  show_badge?: boolean
  /** 文本徽章 */
  show_text_badge?: string
  /** 是否在菜单中隐藏 */
  is_hide?: boolean
  /** 是否在标签页中隐藏 */
  is_hide_tab?: boolean
  /** 外部链接 */
  link?: string
  /** 是否为iframe */
  is_iframe?: boolean
  /** 是否缓存 */
  keep_alive?: boolean
  /** 操作权限 */
  auth_list?: Array<{
    title: string
    auth_mark: string
  }>
  /** 是否为一级菜单 */
  is_first_level?: boolean
  /** 是否固定标签页 */
  fixed_tab?: boolean
  /** 激活菜单路径 */
  active_path?: string
  /** 是否为全屏页面 */
  is_full_page?: boolean
  /** 是否为权限按钮行 */
  is_auth_button?: boolean
  /** 权限标识 */
  auth_mark?: string
  /** 父级路径 */
  parent_path?: string
}

/**
 * 应用路由记录接口
 * 扩展 Vue Router 的路由记录类型
 */
export interface AppRouteRecord extends Omit<RouteRecordRaw, 'meta' | 'children' | 'component'> {
  id?: number
  meta: RouteMeta
  children?: AppRouteRecord[]
  component?: string | (() => Promise<any>)
}
