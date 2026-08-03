/**
 * 表格工具函数模块
 *
 * 提供表格数据处理和请求管理的核心工具函数
 *
 * ## 主要功能
 *
 * - 多格式 API 响应自动适配和标准化
 * - 表格数据提取和转换
 * - 分页信息自动更新和校验
 * - 智能防抖函数（支持取消和立即执行）
 * - 统一的错误处理机制
 * - 嵌套数据结构解析
 *
 * ## 使用场景
 *
 * - useTable 组合式函数的底层工具
 * - 适配各种后端接口响应格式
 * - 表格数据的标准化处理
 * - 请求防抖和性能优化
 * - 错误统一处理和日志记录
 *
 * ## 支持的响应格式
 *
 * 1. 直接数组: [item1, item2, ...]
 * 2. 标准对象: { records: [], total: 100 }
 * 3. 嵌套data: { data: { list: [], total: 100 } }
 * 4. 多种字段名: list/data/records/items/result/rows
 *
 * ## 核心功能
 *
 * - defaultResponseAdapter: 智能识别和转换响应格式
 * - extractTableData: 提取表格数据数组
 * - updatePaginationFromResponse: 更新分页信息
 * - createSmartDebounce: 创建可控的防抖函数
 * - createErrorHandler: 生成错误处理器
 *
 * @module utils/table/tableUtils
 * @author Art Design Pro Team
 */

import type { ApiResponse } from './tableCache'
import { tableConfig } from './tableConfig'

// 请求参数基础接口，扩展分页参数
export interface BaseRequestParams extends Api.Common.PaginationParams {
  [key: string]: unknown
}

// 错误处理接口
export interface TableError {
  code: string
  message: string
  details?: unknown
}

/**
 * 默认响应数据适配器
 *
 * 支持 Laravel 标准分页格式：
 * {
 *   data: [...],
 *   meta: { current_page, per_page, total, ... },
 *   links: {...}
 * }
 *
 * 同时兼容扁平分页格式：
 * { records: [...], total, current, size }
 * { list: [...], totalCount, pageNum, pageSize }
 * { data: [...], total, current, size }
 */
export function defaultResponseAdapter<T>(response: any): ApiResponse<T> {
  if (!response || typeof response !== 'object') {
    return { records: [], total: 0, current: 1, size: 10 }
  }

  const listKey = tableConfig.responseKey.list
  const metaKey = tableConfig.responseKey.meta

  // 优先使用配置的列表字段，然后尝试常见的列表字段
  const records = Array.isArray(response[listKey])
    ? response[listKey]
    : Array.isArray(response.records)
      ? response.records
      : Array.isArray(response.list)
        ? response.list
        : Array.isArray(response.items)
          ? response.items
          : []

  // Laravel 格式：分页信息嵌套在 meta 对象中
  const meta = response[metaKey]
  const source = meta && typeof meta === 'object' ? meta : response

  const totalKey = tableConfig.responseKey.total
  const currentKey = tableConfig.responseKey.current
  const sizeKey = tableConfig.responseKey.size

  const total = Number(source[totalKey] ?? source.totalCount ?? source.total ?? 0)
  const current = Number(source[currentKey] ?? source.pageNum ?? source.current ?? 1)
  const size = Number((source[sizeKey] ?? source.pageSize ?? source.size ?? records.length) || 10)

  return { records, total, current, size }
}

/**
 * 从标准化的API响应中提取表格数据
 */
export const extractTableData = <T>(response: ApiResponse<T>): T[] => {
  const data = response.records || response.data || []
  return Array.isArray(data) ? data : []
}

/**
 * 根据API响应更新分页信息
 */
export const updatePaginationFromResponse = <T>(
  pagination: Api.Common.PaginationParams,
  response: ApiResponse<T>
): void => {
  pagination.total = response.total ?? pagination.total ?? 0

  if (response.current !== undefined) {
    pagination.current = response.current
  }

  const maxPage = Math.max(1, Math.ceil(pagination.total / (pagination.size || 1)))
  if (pagination.current > maxPage) {
    pagination.current = maxPage
  }
}

/**
 * 创建智能防抖函数 - 支持取消和立即执行
 */
export const createSmartDebounce = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => Promise<any> } => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null
  let lastResolve: ((value: any) => void) | null = null
  let lastReject: ((reason: any) => void) | null = null

  const debouncedFn = (...args: Parameters<T>): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) clearTimeout(timeoutId)
      lastArgs = args
      lastResolve = resolve
      lastReject = reject
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          timeoutId = null
          lastArgs = null
          lastResolve = null
          lastReject = null
        }
      }, delay)
    })
  }

  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = null
    lastArgs = null
    lastResolve = null
    lastReject = null
  }

  debouncedFn.flush = async () => {
    if (timeoutId && lastArgs && lastResolve && lastReject) {
      clearTimeout(timeoutId)
      timeoutId = null
      const args = lastArgs
      const resolve = lastResolve
      const reject = lastReject
      lastArgs = null
      lastResolve = null
      lastReject = null
      try {
        const result = await fn(...args)
        resolve(result)
        return result
      } catch (error) {
        reject(error)
        throw error
      }
    }
    return Promise.resolve()
  }

  return debouncedFn as any
}

/**
 * 生成错误处理函数
 */
export const createErrorHandler = (
  onError?: (error: TableError) => void,
  enableLog: boolean = false
) => {
  const logger = {
    error: (message: string, ...args: any[]) => {
      if (enableLog) console.error(`[useTable] ${message}`, ...args)
    }
  }

  return (err: unknown, context: string): TableError => {
    const tableError: TableError = {
      code: 'UNKNOWN_ERROR',
      message: '未知错误',
      details: err
    }

    if (err instanceof Error) {
      tableError.message = err.message
      tableError.code = err.name
    } else if (typeof err === 'string') {
      tableError.message = err
    }

    logger.error(`${context}:`, err)
    onError?.(tableError)
    return tableError
  }
}
