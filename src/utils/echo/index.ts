/**
 * Laravel Echo 配置与初始化模块
 *
 * 基于 laravel-echo v2 + Reverb WebSocket 实现实时广播通信。
 *
 * ## 主要功能
 *
 * - Echo 实例的创建与销毁
 * - 自动绑定当前用户认证 token（Sanctum Bearer Token）
 * - 频道监听事件的便捷封装
 * - 连接状态监听（connected / disconnected / error）
 *
 * ## 使用示例
 *
 * ```ts
 * import { useEcho } from '@/utils/echo'
 *
 * const echo = useEcho()
 *
 * // 监听公共频道
 * echo.channel('orders').listen('OrderShipped', (e) => {
 *   console.log(e.order)
 * })
 *
 * // 监听私有频道（需认证）
 * echo.private('orders.' + orderId).listen('OrderUpdated', (e) => {
 *   console.log(e)
 * })
 *
 * // 离开频道
 * echo.leave('orders')
 * ```
 *
 * @module utils/echo
 * @author Art Design Pro Team
 */

import { useUserStore } from '@/store/modules/user'
import Echo from 'laravel-echo'

/** Echo 实例类型（从类构造器推导） */
type EchoInstance = InstanceType<typeof Echo>

/** Reverb 连接选项 */
interface EchoOptions {
  /** Reverb 应用 Key */
  key: string
  /** WebSocket 主机地址 */
  host: string
  /** WebSocket 端口 */
  port: number
  /** 协议：http / https（对应 ws / wss） */
  scheme: 'http' | 'https'
  /** 请求前缀（如 /api/broadcasting/auth） */
  authEndpoint: string
  /** 跨域是否携带凭证 */
  withCredentials: boolean
}

/** 环境变量解析 */
const env = import.meta.env

const echoOptions: EchoOptions = {
  key: env.VITE_REVERB_APP_KEY || 'app-key',
  host:
    env.VITE_REVERB_HOST ||
    (env.VITE_API_PROXY_URL ? new URL(env.VITE_API_PROXY_URL).hostname : 'localhost'),
  port: Number(env.VITE_REVERB_PORT || 8080),
  scheme: (env.VITE_REVERB_SCHEME as 'http' | 'https') || 'http',
  authEndpoint: '/broadcasting/auth',
  withCredentials: env.VITE_WITH_CREDENTIALS === 'true'
}

/** 单例实例 */
let echoInstance: EchoInstance | null = null

/**
 * 构建认证头
 *
 * 从 userStore 读取 Sanctum token 并构造 Authorization 头。
 */
function buildAuthHeaders(): Record<string, string> {
  const token = useUserStore().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * 创建并返回 Echo 实例（单例）
 *
 * 首次调用时建立连接，后续调用复用同一实例。
 * 认证 token 取自 Pinia userStore，会随登录/登出自动变化。
 */
export function useEcho(): EchoInstance {
  if (echoInstance) {
    return echoInstance
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: echoOptions.key,
    wsHost: echoOptions.host,
    wsPort: echoOptions.port,
    wssPort: echoOptions.port,
    forceTLS: echoOptions.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: echoOptions.authEndpoint,
    withCredentials: echoOptions.withCredentials,
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: any) => {
        const baseURL = env.VITE_API_URL || '/'
        fetch(baseURL.replace(/\/$/, '') + echoOptions.authEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Socket-ID': socketId,
            ...buildAuthHeaders()
          },
          credentials: echoOptions.withCredentials ? 'include' : 'same-origin',
          body: JSON.stringify({
            channel_name: channel.name,
            socket_id: socketId
          })
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Broadcast auth failed: ${res.status}`)
            return res.json()
          })
          .then((data) => callback(null, data))
          .catch((err) => callback(err))
      }
    })
  })

  // 连接状态事件（仅调试输出，不影响业务）
  const socket: any = (echoInstance as any).connector?.socket
  if (socket) {
    socket.on('connect', () => {
      console.info('[Echo] WebSocket connected')
    })
    socket.on('disconnect', (reason: string) => {
      console.warn('[Echo] WebSocket disconnected:', reason)
    })
    socket.on('connect_error', (err: any) => {
      console.error('[Echo] WebSocket connect error:', err?.message || err)
    })
  }

  return echoInstance
}

/**
 * 销毁 Echo 实例并断开连接
 *
 * 登出时调用，避免遗留连接。
 */
export function destroyEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      /* ignore */
    }
    echoInstance = null
  }
}

/**
 * 判断 Echo 是否已连接
 */
export function isEchoConnected(): boolean {
  if (!echoInstance) return false
  const socket: any = (echoInstance as any).connector?.socket
  return socket?.connected === true
}
