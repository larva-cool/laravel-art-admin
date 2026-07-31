/**
 * HTTP 错误处理模块
 *
 * 提供统一的 HTTP 请求错误处理机制
 *
 * ## 主要功能
 *
 * - 自定义 HttpError 错误类，封装错误信息、状态码、时间戳等
 * - 错误拦截和转换，将 Axios 错误转换为标准的 HttpError
 * - 错误消息国际化处理，根据状态码返回对应的多语言错误提示
 * - 兼容 Laravel 后端错误格式（message/errors 字段）
 * - 错误日志记录，便于问题追踪和调试
 * - 错误和成功消息的统一展示
 * - 类型守卫函数，用于判断错误类型
 *
 * @module utils/http/error
 */

import { $t } from '@/locales'
import { AxiosError } from 'axios'
import { ApiStatus } from './status'

/** Laravel 后端错误响应格式 */
export interface LaravelErrorResponse {
  /** 错误消息（Laravel 使用 message 字段） */
  message?: string
  /** 字段级验证错误（422 ValidationException 返回） */
  errors?: Record<string, string[]>
  /** 旧格式兼容（前端 mock 可能仍有 msg） */
  msg?: string
  /** 错误状态码（部分场景返回） */
  code?: number
}

// 错误日志数据接口
export interface ErrorLogData {
  /** 错误状态码 */
  code: number
  /** 错误消息 */
  message: string
  /** 错误附加数据 */
  data?: unknown
  /** 错误发生时间戳 */
  timestamp: string
  /** 请求 URL */
  url?: string
  /** 请求方法 */
  method?: string
  /** 错误堆栈信息 */
  stack?: string
}

// 自定义 HttpError 类
export class HttpError extends Error {
  public readonly code: number
  public readonly data?: unknown
  public readonly timestamp: string
  public readonly url?: string
  public readonly method?: string

  constructor(
    message: string,
    code: number,
    options?: {
      data?: unknown
      url?: string
      method?: string
    }
  ) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.data = options?.data
    this.timestamp = new Date().toISOString()
    this.url = options?.url
    this.method = options?.method
  }

  public toLogData(): ErrorLogData {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
      url: this.url,
      method: this.method,
      stack: this.stack
    }
  }
}

/**
 * 从 Laravel 错误响应中提取错误消息
 * 优先取 message，422 时取 errors 中第一个字段的第一条消息
 */
function extractLaravelErrorMessage(body?: LaravelErrorResponse): string | undefined {
  if (!body) return undefined
  // 422 验证错误：取第一个字段的第一条错误消息
  if (body.errors && typeof body.errors === 'object') {
    const firstField = Object.keys(body.errors)[0]
    if (
      firstField &&
      Array.isArray(body.errors[firstField]) &&
      body.errors[firstField].length > 0
    ) {
      return body.errors[firstField][0]
    }
  }
  return body.message || body.msg
}

/**
 * 获取错误消息
 * @param status 错误状态码
 * @returns 错误消息
 */
const getErrorMessage = (status: number): string => {
  const errorMap: Record<number, string> = {
    [ApiStatus.unauthorized]: 'httpMsg.unauthorized',
    [ApiStatus.forbidden]: 'httpMsg.forbidden',
    [ApiStatus.notFound]: 'httpMsg.notFound',
    [ApiStatus.methodNotAllowed]: 'httpMsg.methodNotAllowed',
    [ApiStatus.requestTimeout]: 'httpMsg.requestTimeout',
    [ApiStatus.unprocessableEntity]: 'httpMsg.validationError',
    [ApiStatus.internalServerError]: 'httpMsg.internalServerError',
    [ApiStatus.badGateway]: 'httpMsg.badGateway',
    [ApiStatus.serviceUnavailable]: 'httpMsg.serviceUnavailable',
    [ApiStatus.gatewayTimeout]: 'httpMsg.gatewayTimeout'
  }

  return $t(errorMap[status] || 'httpMsg.internalServerError')
}

/**
 * 处理错误
 * @param error 错误对象
 * @returns 错误对象（抛出 HttpError）
 */
export function handleError(error: AxiosError<LaravelErrorResponse>): never {
  // 处理取消的请求
  if (error.code === 'ERR_CANCELED') {
    console.warn('Request cancelled:', error.message)
    throw new HttpError($t('httpMsg.requestCancelled'), ApiStatus.error)
  }

  const statusCode = error.response?.status
  const requestConfig = error.config

  // 处理网络错误（无响应）
  if (!error.response) {
    throw new HttpError($t('httpMsg.networkError'), ApiStatus.error, {
      url: requestConfig?.url,
      method: requestConfig?.method?.toUpperCase()
    })
  }

  // 从 Laravel 错误响应体中提取 message
  const laravelMessage = extractLaravelErrorMessage(error.response.data)

  // 对于 422（表单验证失败），使用后端返回的字段级错误消息；
  // 对于其他状态码，如果后端有返回 message 则优先使用后端消息，否则按状态码取 i18n 默认消息
  const message = laravelMessage
    ? laravelMessage
    : statusCode
      ? getErrorMessage(statusCode)
      : $t('httpMsg.requestFailed')

  throw new HttpError(message, statusCode || ApiStatus.error, {
    data: error.response.data,
    url: requestConfig?.url,
    method: requestConfig?.method?.toUpperCase()
  })
}

/**
 * 显示错误消息
 * @param error 错误对象
 * @param showMessage 是否显示错误消息
 */
export function showError(error: HttpError, showMessage: boolean = true): void {
  if (showMessage) {
    ElMessage.error(error.message)
  }
  // 记录错误日志
  console.error('[HTTP Error]', error.toLogData())
}

/**
 * 显示成功消息
 * @param message 成功消息
 * @param showMessage 是否显示消息
 */
export function showSuccess(message: string, showMessage: boolean = true): void {
  if (showMessage) {
    ElMessage.success(message)
  }
}

/**
 * 判断是否为 HttpError 类型
 * @param error 错误对象
 * @returns 是否为 HttpError 类型
 */
export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError
}
