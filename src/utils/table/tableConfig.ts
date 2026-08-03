/**
 * 表格全局配置
 *
 * 集中管理表格相关的全局配置，包括分页字段名、默认配置等。
 * 各业务模块可以通过 useTable 的参数覆盖这些配置。
 */

/** 分页相关字段名配置（Laravel 格式） */
export const tableConfig = {
  /** 分页请求/响应字段名映射 */
  paginationKey: {
    /** 请求时的当前页码字段名（Laravel 使用 page） */
    current: 'page',
    /** 请求时的每页条数字段名（Laravel 使用 per_page） */
    size: 'per_page'
  },

  /** 响应数据中分页字段名映射（Laravel 分页 JSON 结构） */
  responseKey: {
    /** 数据列表字段名 */
    list: 'data',
    /** 当前页码字段名（嵌套在 meta 中） */
    current: 'current_page',
    /** 每页条数字段名（嵌套在 meta 中） */
    size: 'per_page',
    /** 总条数字段名（嵌套在 meta 中） */
    total: 'total',
    /** 分页元数据字段名 */
    meta: 'meta'
  },

  /** 默认分页配置 */
  defaultPagination: {
    /** 默认当前页 */
    current: 1,
    /** 默认每页条数 */
    size: 10,
    /** 默认总条数 */
    total: 0
  },

  /** 每页条数选项 */
  pageSizes: [10, 20, 30, 50, 100],

  /** 默认每页条数 */
  pageSize: 10,

  /** 默认防抖延迟（毫秒） */
  defaultDebounceTime: 300
}

/** 表格配置类型 */
export type TableConfig = typeof tableConfig
