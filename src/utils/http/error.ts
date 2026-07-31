/**
 * HTTP 错误处理模块
 *
 * 适配 Laravel 后端错误响应格式：
 * - 422 ValidationException: { message: "...", errors: { field: ["msg", ...] } }
 * - 其他错误 (abort/Authorization): { message: "错误信息" }
 * - 未认证重定向到 /login 路由: { code: 401, message: "...", data: null }
 *
 * @module utils/http/error
 */

import { $t } from '@/locales'
import { AxiosError } from 'axios'
import { ApiStatus } from './status'

/** Laravel 后端错误响应格式 */
export interface LaravelErrorResponse {
  message?: string
  errors?: Record<string, string[]>
  code?: number
}

// 错误日志数据接口
export interface ErrorLogData {
  code: number
  message: string
  data?: unknown
  timestamp: string
  url?: string
  method?: string
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
 * - 422 验证错误：取 errors 中第一个字段的第一条错误消息
 * - 其他错误：取 message 字段
 */
function extractErrorMessage(body?: LaravelErrorResponse): string | undefined {
  if (!body) return undefined
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
  return body.message
}

/**
 * 根据 HTTP 状态码获取默认错误消息（后端未返回 message 时使用）
 */
const getDefaultMessage = (status: number): string => {
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
 * 处理 Axios 错误，转换为 HttpError 抛出
 */
export function handleError(error: AxiosError<LaravelErrorResponse>): never {
  if (error.code === 'ERR_CANCELED') {
    console.warn('Request cancelled:', error.message)
    throw new HttpError($t('httpMsg.requestCancelled'), ApiStatus.error)
  }

  const requestConfig = error.config

  if (!error.response) {
    throw new HttpError($t('httpMsg.networkError'), ApiStatus.error, {
      url: requestConfig?.url,
      method: requestConfig?.method?.toUpperCase()
    })
  }

  const statusCode = error.response.status
  const laravelMessage = extractErrorMessage(error.response.data)
  const message = laravelMessage || getDefaultMessage(statusCode)

  throw new HttpError(message, statusCode, {
    data: error.response.data,
    url: requestConfig?.url,
    method: requestConfig?.method?.toUpperCase()
  })
}

/**
 * 显示错误消息
 */
export function showError(error: HttpError, showMessage: boolean = true): void {
  if (showMessage) {
    ElMessage.error(error.message)
  }
  console.error('[HTTP Error]', error.toLogData())
}

/**
 * 显示成功消息
 */
export function showSuccess(message: string, showMessage: boolean = true): void {
  if (showMessage) {
    ElMessage.success(message)
  }
}

/**
 * 类型守卫：判断是否为 HttpError
 */
export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError
}
