/** 附件管理页共用的展示常量与格式化函数 */

/** 左侧目录（按文件类型模拟目录归类） */
export const typeItems = [
  { value: '', label: '全部文件', icon: 'ri:folder-2-line' },
  { value: 'image', label: '图片资源', icon: 'ri:image-line' },
  { value: 'document', label: '文档资料', icon: 'ri:file-text-line' },
  { value: 'video', label: '视频文件', icon: 'ri:video-line' },
  { value: 'audio', label: '音频文件', icon: 'ri:music-2-line' },
  { value: 'other', label: '其他文件', icon: 'ri:file-3-line' }
]

/** 文件类型标签英文大写名（表格列用，对齐设计图） */
export const typeLabelUpper: Record<string, string> = {
  image: 'IMAGE',
  video: 'VIDEO',
  audio: 'AUDIO',
  document: 'DOC',
  other: 'OTHER'
}

/** 文件类型标签配色 */
export const typeTagType: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  image: 'success',
  video: 'primary',
  audio: 'info',
  document: 'warning',
  other: 'info'
}

/** 文件类型图标 */
export function typeIcon(type: string): string {
  return typeItems.find((item) => item.value === type)?.icon ?? 'ri:file-3-line'
}

/** 存储磁盘展示名 */
export function diskLabel(disk: string): string {
  const labels: Record<string, string> = {
    local: '本地私有',
    public: '本地公开',
    s3: 'S3 云存储'
  }
  return labels[disk] ?? disk
}

/** 从完整路径截取所属目录 */
export function directoryOf(path: string): string {
  const directory = path.split('/').slice(0, -1).join('/')
  return directory || '根目录'
}

/** 是否为私有存储（私有文件仅能通过临时签名地址访问） */
export function isPrivateDisk(disk: string): boolean {
  return disk === 'local'
}
