import request from '@/utils/http'

// ========== 调试面板（Laravel Telescope） ==========

/** 调试条目类型（与后端 DebugIndexRequest::TYPES 保持一致） */
export type DebugEntryType =
  | 'request'
  | 'command'
  | 'schedule'
  | 'job'
  | 'batch'
  | 'cache'
  | 'query'
  | 'model'
  | 'event'
  | 'mail'
  | 'notification'
  | 'gate'
  | 'view'
  | 'redis'
  | 'exception'
  | 'log'
  | 'dump'
  | 'client_request'

/** 采集状态 */
export type DebugStatus = 'enabled' | 'paused' | 'disabled' | 'off'

/** 调试条目 */
export interface DebugEntry {
  id: string
  sequence: number | null
  batch_id: string
  type: DebugEntryType
  content: Record<string, any>
  tags: string[]
  family_hash: string | null
  created_at: string
}

/** 条目列表响应 */
export interface DebugEntriesResponse {
  type: DebugEntryType
  status: DebugStatus
  entries: DebugEntry[]
  next_before: number | null
}

/** 条目详情响应 */
export interface DebugEntryResponse {
  entry: DebugEntry
  batch: DebugEntry[]
}

/** 监控标签响应 */
export interface DebugTagsResponse {
  message?: string
  tags: string[]
}

/** 记录开关响应 */
export interface DebugRecordingResponse {
  message: string
  paused: boolean
}

/** 条目列表查询参数 */
export interface DebugEntriesParams {
  type: DebugEntryType
  tag?: string
  family_hash?: string
  batch_id?: string
  /** 游标：加载 sequence 小于该值的条目 */
  before?: number
  /** 每页条数，1 ~ 100 */
  take?: number
}

// ----- API 方法 -----

/** 条目列表（游标分页） */
export function fetchDebugEntries(params: DebugEntriesParams) {
  return request.get<DebugEntriesResponse>({ url: '/admin/debug/entries', params })
}

/** 条目详情及同批次条目 */
export function fetchDebugEntry(id: string) {
  return request.get<DebugEntryResponse>({ url: `/admin/debug/entries/${id}` })
}

/** 将异常条目标记为已解决 */
export function resolveDebugException(id: string) {
  return request.put<{ message: string; entry: DebugEntry }>({
    url: `/admin/debug/entries/${id}/resolve`,
    showSuccessMessage: true,
    successMessage: '已标记为解决'
  })
}

/** 正在监控的标签 */
export function fetchDebugTags() {
  return request.get<DebugTagsResponse>({ url: '/admin/debug/tags' })
}

/** 新增监控标签 */
export function monitorDebugTag(tag: string) {
  return request.post<DebugTagsResponse>({
    url: '/admin/debug/tags',
    params: { tag },
    showSuccessMessage: true,
    successMessage: '已开始监控'
  })
}

/** 移除监控标签 */
export function unmonitorDebugTag(tag: string) {
  return request.del<DebugTagsResponse>({
    url: '/admin/debug/tags',
    data: { tag },
    showSuccessMessage: true,
    successMessage: '已停止监控'
  })
}

/** 切换记录开关（暂停 / 恢复采集） */
export function toggleDebugRecording() {
  return request.post<DebugRecordingResponse>({ url: '/admin/debug/toggle-recording' })
}

/** 清空全部调试记录 */
export function clearDebugEntries() {
  return request.del<{ message: string }>({
    url: '/admin/debug/entries',
    showSuccessMessage: true,
    successMessage: '已清空调试记录'
  })
}
