/**
 * HTTP 请求封装模块
 * 基于 Axios 封装的 HTTP 请求工具，适配 Laravel 后端原生响应格式
 *
 * ## 主要功能
 *
 * - 请求拦截器：自动添加 Bearer Token
 * - 响应拦截器：HTTP 2xx 视为成功（Laravel 无统一外层包装）；检测 body.code===401 兜底处理
 * - 401 未授权自动登出（带防抖机制）
 * - 请求失败自动重试（可配置）
 * - 统一的错误消息展示（兼容 Laravel message/errors 字段）
 * - 支持 GET/POST/PUT/DELETE 等常用方法
 *
 * ## 后端响应格式说明（Laravel 原生）
 *
 * - 成功（200/201）：直接返回数据（单对象/数组/分页对象 `{data, links, meta}`），无外层包装
 * - 删除/登出（204）：无 body
 * - 登录成功（200）：`{ access_token: "...", user: {...} }`
 * - 401 未认证：HTTP 401 或 body 为 `{ code: 401, message: "...", data: null }`
 * - 422 验证失败：`{ message: "...", errors: { field: ["msg"] } }`
 * - 其他错误（abort）：`{ message: "错误信息" }`
 *
 * @module utils/http
 */

import { $t } from '@/locales'
import { useUserStore } from '@/store/modules/user'
import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { HttpError, handleError, showError, showSuccess } from './error'
import { ApiStatus } from './status'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 0
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
  /** 自定义成功消息（后端无 msg 字段时使用） */
  successMessage?: string
}

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env

/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: VITE_API_URL,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore()
    if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`)

    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }

    return request
  },
  (error) => {
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器
 *
 *  Laravel 后端没有统一的 `{code, msg, data}` 外层包装，所以成功响应直接放行。
 *  额外检测响应体中是否存在 code===401（例如后端 /login 路由兜底返回的 JSON），
 *  如果存在则触发未授权处理。
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 204 No Content（删除/登出等）直接放行，body 为空
    if (response.status === ApiStatus.noContent) return response

    const body = response.data
    // 兼容 body 内部包含 code===401 的场景（Laravel 未认证重定向到 /login 返回）
    if (body && typeof body === 'object' && body.code === ApiStatus.unauthorized) {
      handleUnauthorizedError(body.message)
    }
    return response
  },
  (error) => {
    if (error.response?.status === ApiStatus.unauthorized) handleUnauthorizedError()
    return Promise.reject(handleError(error))
  }
)

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理401错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    showError(error, true)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 是否需要重试 */
function shouldRetry(statusCode: number) {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.internalServerError,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求函数
 *
 *  Laravel 后端无 `{code,msg,data}` 外层包装，成功响应直接返回 response.data（即响应体本身）。
 *  - 单资源 GET：直接返回 Resource 对象
 *  - 分页 GET：返回 `{data, links, meta}`（由上层 table adapter 解析）
 *  - 列表 GET：返回数组
 *  - 登录：返回 `{access_token, user}`
 *  - 204 No Content：返回 null
 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // POST | PUT 参数自动填充（params 搬到 data）
  if (
    ['POST', 'PUT'].includes(config.method?.toUpperCase() || '') &&
    config.params &&
    !config.data
  ) {
    config.data = config.params
    config.params = undefined
  }

  try {
    const res = await axiosInstance.request(config)

    // 204 No Content 返回 null
    if (res.status === ApiStatus.noContent) {
      if (config.showSuccessMessage)
        showSuccess(config.successMessage || $t('httpMsg.operationSuccess'))
      return null as T
    }

    // 显示成功消息：优先使用调用方传入的 successMessage（因为后端无 msg 字段）
    if (config.showSuccessMessage) {
      showSuccess(config.successMessage || $t('httpMsg.operationSuccess'))
    }

    return res.data as T
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

export default api
