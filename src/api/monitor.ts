import request from '@/utils/http'

// ========== 性能监控（Laravel Pulse） ==========

/** 统计周期 */
export type PulsePeriod = '1_hour' | '6_hours' | '24_hours' | '7_days'

/** 时间序列数据点 */
export interface PulseSeriesPoint {
  time: string
  value: number | null
}

/** 服务器资源 */
export interface PulseServer {
  slug: string
  name: string
  cpu_current: number
  cpu: PulseSeriesPoint[]
  memory_current: number
  memory_total: number
  memory: PulseSeriesPoint[]
  storage: Array<{
    directory: string
    total: number
    used: number
  }>
  updated_at: string
  recently_reported: boolean
}

/** 队列吞吐 */
export interface PulseQueue {
  key: string
  connection: string
  queue: string
  queued: PulseSeriesPoint[]
  processing: PulseSeriesPoint[]
  processed: PulseSeriesPoint[]
  released: PulseSeriesPoint[]
  failed: PulseSeriesPoint[]
}

/** 缓存 key 统计 */
export interface PulseCacheKey {
  key: string
  hits: number
  misses: number
}

/** 采集器配置 */
export interface PulseRecorderConfig {
  threshold: number | null
  sample_rate: number | null
}

/** 服务器资源响应 */
export interface PulseServersResponse {
  period: PulsePeriod
  servers: PulseServer[]
}

/** 队列吞吐响应 */
export interface PulseQueuesResponse {
  period: PulsePeriod
  queues: PulseQueue[]
  config: PulseRecorderConfig
}

/** Reverb WebSocket 连接统计 */
export interface PulseReverbConnectionsApp {
  app_id: string
  current: number | null
  peak: number
  avg: PulseSeriesPoint[]
  max: PulseSeriesPoint[]
}

/** Reverb 连接响应 */
export interface PulseReverbConnectionsResponse {
  period: PulsePeriod
  apps: PulseReverbConnectionsApp[]
  config: PulseRecorderConfig
}

/** Reverb 消息吞吐 */
export interface PulseReverbMessagesApp {
  app_id: string
  sent_total: number
  received_total: number
  sent: PulseSeriesPoint[]
  received: PulseSeriesPoint[]
}

/** Reverb 消息响应 */
export interface PulseReverbMessagesResponse {
  period: PulsePeriod
  apps: PulseReverbMessagesApp[]
  config: PulseRecorderConfig
}

/** 缓存命中率响应 */
export interface PulseCacheResponse {
  period: PulsePeriod
  all: { hits: number; misses: number }
  keys: PulseCacheKey[]
  config: PulseRecorderConfig
}

/** 异常统计项 */
export interface PulseExceptionItem {
  class: string
  location: string
  latest: string
  count: number
}

/** 异常统计响应 */
export interface PulseExceptionsResponse {
  period: PulsePeriod
  order_by: 'count' | 'latest'
  exceptions: PulseExceptionItem[]
  config: PulseRecorderConfig
}

/** 慢查询项 */
export interface PulseSlowQueryItem {
  sql: string
  location: string
  slowest: number
  count: number
  threshold: number
}

/** 慢查询响应 */
export interface PulseSlowQueriesResponse {
  period: PulsePeriod
  order_by: 'slowest' | 'count'
  slow_queries: PulseSlowQueryItem[]
  config: PulseRecorderConfig
}

/** 慢请求项 */
export interface PulseSlowRequestItem {
  method: string
  uri: string
  action: string
  slowest: number
  count: number
  threshold: number
}

/** 慢请求响应 */
export interface PulseSlowRequestsResponse {
  period: PulsePeriod
  order_by: 'slowest' | 'count'
  slow_requests: PulseSlowRequestItem[]
  config: PulseRecorderConfig
}

/** 慢任务项 */
export interface PulseSlowJobItem {
  job: string
  slowest: number
  count: number
  threshold: number
}

/** 慢任务响应 */
export interface PulseSlowJobsResponse {
  period: PulsePeriod
  order_by: 'slowest' | 'count'
  slow_jobs: PulseSlowJobItem[]
  config: PulseRecorderConfig
}

/** 慢外部请求项 */
export interface PulseSlowOutgoingRequestItem {
  method: string
  uri: string
  slowest: number
  count: number
  threshold: number
}

/** 慢外部请求响应 */
export interface PulseSlowOutgoingRequestsResponse {
  period: PulsePeriod
  order_by: 'slowest' | 'count'
  slow_outgoing_requests: PulseSlowOutgoingRequestItem[]
  config: PulseRecorderConfig
}

/** 用户使用量项 */
export interface PulseUsageItem {
  key: string
  name: string | null
  extra: unknown
  avatar: string | null
  count: number
}

/** 用户使用量响应 */
export interface PulseUsageResponse {
  period: PulsePeriod
  type: 'requests' | 'slow_requests' | 'jobs'
  users: PulseUsageItem[]
}

/** 公共查询参数 */
export interface PulseParams {
  period?: PulsePeriod
}

/** 排序查询参数 */
export interface PulseOrderByParams extends PulseParams {
  order_by?: string
}

/** 使用量查询参数 */
export interface PulseUsageParams extends PulseParams {
  type?: 'requests' | 'slow_requests' | 'jobs'
}

// ----- API 方法 -----

/** 服务器资源（CPU / 内存 / 磁盘） */
export function fetchPulseServers(params?: PulseParams) {
  return request.get<PulseServersResponse>({ url: '/admin/monitor/servers', params })
}

/** 队列吞吐 */
export function fetchPulseQueues(params?: PulseParams) {
  return request.get<PulseQueuesResponse>({ url: '/admin/monitor/queues', params })
}

/** Reverb WebSocket 连接数 */
export function fetchPulseReverbConnections(params?: PulseParams) {
  return request.get<PulseReverbConnectionsResponse>({
    url: '/admin/monitor/reverb/connections',
    params
  })
}

/** Reverb 消息吞吐 */
export function fetchPulseReverbMessages(params?: PulseParams) {
  return request.get<PulseReverbMessagesResponse>({
    url: '/admin/monitor/reverb/messages',
    params
  })
}

/** 缓存命中率 */
export function fetchPulseCache(params?: PulseParams) {
  return request.get<PulseCacheResponse>({ url: '/admin/monitor/cache', params })
}

/** 异常统计 */
export function fetchPulseExceptions(params?: PulseOrderByParams) {
  return request.get<PulseExceptionsResponse>({ url: '/admin/monitor/exceptions', params })
}

/** 慢查询 */
export function fetchPulseSlowQueries(params?: PulseOrderByParams) {
  return request.get<PulseSlowQueriesResponse>({ url: '/admin/monitor/slow-queries', params })
}

/** 慢请求 */
export function fetchPulseSlowRequests(params?: PulseOrderByParams) {
  return request.get<PulseSlowRequestsResponse>({ url: '/admin/monitor/slow-requests', params })
}

/** 慢任务 */
export function fetchPulseSlowJobs(params?: PulseOrderByParams) {
  return request.get<PulseSlowJobsResponse>({ url: '/admin/monitor/slow-jobs', params })
}

/** 慢外部请求 */
export function fetchPulseSlowOutgoingRequests(params?: PulseOrderByParams) {
  return request.get<PulseSlowOutgoingRequestsResponse>({
    url: '/admin/monitor/slow-outgoing-requests',
    params
  })
}

/** 用户使用量排行 */
export function fetchPulseUsage(params?: PulseUsageParams) {
  return request.get<PulseUsageResponse>({ url: '/admin/monitor/usage', params })
}
