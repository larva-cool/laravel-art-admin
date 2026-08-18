import request from '@/utils/http'

// ========== 队列监控（Laravel Horizon） ==========

/** Dashboard 统计数据 */
export interface HorizonStats {
  failedJobs: number
  jobsPerMinute: number
  pausedMasters: number
  periods: {
    failedJobs: number
    recentJobs: number
  }
  processes: number
  queueWithMaxRuntime: string | null
  queueWithMaxThroughput: string | null
  recentJobs: number
  status: 'running' | 'paused' | 'inactive'
  wait: Array<{ name: string; wait: number }>
}

/** 队列工作负载项 */
export interface HorizonWorkload {
  name: string
  queue: string
  connection: string
  length: number
  wait: number
  processes: number
}

/** 主监督器 */
export interface HorizonMaster {
  name: string
  status: string
  supervisors: HorizonSupervisor[]
}

/** 监督器 */
export interface HorizonSupervisor {
  name: string
  master: string
  status: string
  processes: HorizonProcess[]
  options: {
    queue: string
    balance: string | null
  }
}

/** 进程 */
export interface HorizonProcess {
  pid: number
  state: string
  status: string
}

/** 监控标签 */
export interface HorizonMonitoringTag {
  tag: string
  count: number
}

/** 指标快照 */
export interface HorizonMetricSnapshot {
  time: string
  runtime: number
  throughput: number
}

/** 批处理 */
export interface HorizonBatch {
  id: string
  name: string
  total_jobs: number
  pending_jobs: number
  failed_jobs: number
  processed_jobs: number
  progress: number
  created_at: string
  cancelled_at: string | null
  finished_at: string | null
}

/** 批处理详情 */
export interface HorizonBatchDetail {
  batch: HorizonBatch
  failedJobs: HorizonJob[] | null
}

/** 任务 */
export interface HorizonJob {
  id: string | number
  name: string
  queue: string
  connection: string
  status: string
  payload: any
  exception?: string
  context?: any
  retried_by?: any[]
  failed_at?: string
  completed_at?: string
  created_at?: string
  reserved_at?: string
  available_at?: string
}

/** 任务列表响应 */
export interface HorizonJobListResponse {
  jobs: HorizonJob[]
  total: number
}

// ----- API 方法 -----

/** Dashboard 统计数据 */
export function fetchHorizonStats() {
  return request.get<HorizonStats>({ url: '/admin/queue/stats' })
}

/** 各队列工作负载 */
export function fetchHorizonWorkload() {
  return request.get<HorizonWorkload[]>({ url: '/admin/queue/workload' })
}

/** 主监督器 */
export function fetchHorizonMasters() {
  return request.get<HorizonMaster[]>({ url: '/admin/queue/masters' })
}

/** 监控标签列表 */
export function fetchHorizonMonitoringTags() {
  return request.get<HorizonMonitoringTag[]>({ url: '/admin/queue/monitoring/tags' })
}

/** 监控标签下的任务 */
export function fetchHorizonMonitoringJobs(params?: {
  starting_at?: number
  limit?: number
  tag?: string
}) {
  return request.get<HorizonJobListResponse>({ url: '/admin/queue/monitoring/jobs', params })
}

/** 新增监控标签 */
export function monitorHorizonTag(tag: string) {
  return request.post({ url: '/admin/queue/monitoring/tags', data: { tag } })
}

/** 取消监控标签 */
export function stopMonitoringHorizonTag(tag: string) {
  return request.del<void>({ url: `/admin/queue/monitoring/tags/${encodeURIComponent(tag)}` })
}

/** 任务指标列表 */
export function fetchHorizonJobMetrics() {
  return request.get<string[]>({ url: '/admin/queue/metrics/jobs' })
}

/** 任务指标快照 */
export function fetchHorizonJobMetricsDetail(id: string) {
  return request.get<HorizonMetricSnapshot[]>({ url: `/admin/queue/metrics/jobs/${id}` })
}

/** 队列指标列表 */
export function fetchHorizonQueueMetrics() {
  return request.get<string[]>({ url: '/admin/queue/metrics/queues' })
}

/** 队列指标快照 */
export function fetchHorizonQueueMetricsDetail(id: string) {
  return request.get<HorizonMetricSnapshot[]>({ url: `/admin/queue/metrics/queues/${id}` })
}

/** 批处理列表 */
export function fetchHorizonBatches(params?: { before_id?: string; query?: string }) {
  return request.get<{ batches: HorizonBatch[] }>({ url: '/admin/queue/batches', params })
}

/** 批处理详情 */
export function fetchHorizonBatchDetail(id: string) {
  return request.get<HorizonBatchDetail>({ url: `/admin/queue/batches/${id}` })
}

/** 重试批处理中的失败任务 */
export function retryHorizonBatch(id: string) {
  return request.post({ url: `/admin/queue/batches/${id}/retry` })
}

/** 待处理任务列表 */
export function fetchHorizonPendingJobs(params?: { starting_at?: number }) {
  return request.get<HorizonJobListResponse>({ url: '/admin/queue/jobs/pending', params })
}

/** 已完成任务列表 */
export function fetchHorizonCompletedJobs(params?: { starting_at?: number }) {
  return request.get<HorizonJobListResponse>({ url: '/admin/queue/jobs/completed', params })
}

/** 静默任务列表 */
export function fetchHorizonSilencedJobs(params?: { starting_at?: number }) {
  return request.get<HorizonJobListResponse>({ url: '/admin/queue/jobs/silenced', params })
}

/** 失败任务列表 */
export function fetchHorizonFailedJobs(params?: { starting_at?: number; tag?: string }) {
  return request.get<HorizonJobListResponse>({ url: '/admin/queue/jobs/failed', params })
}

/** 失败任务详情 */
export function fetchHorizonFailedJobDetail(id: string) {
  return request.get<HorizonJob>({ url: `/admin/queue/jobs/failed/${id}` })
}

/** 重试失败任务 */
export function retryHorizonJob(id: string) {
  return request.post({ url: `/admin/queue/jobs/failed/${id}/retry` })
}

/** 任务详情 */
export function fetchHorizonJob(id: string) {
  return request.get<HorizonJob>({ url: `/admin/queue/jobs/${id}` })
}
