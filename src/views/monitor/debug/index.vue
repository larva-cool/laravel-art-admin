<template>
  <div class="debug-panel">
    <!-- 顶部工具栏 -->
    <div class="art-card p-4 mb-4 flex-cb flex-wrap gap-3">
      <div class="flex-c gap-2">
        <ArtSvgIcon icon="ri:bug-line" class="text-lg text-theme" />
        <h3 class="text-base font-medium text-g-900">调试面板</h3>
        <ElTag size="small" :type="statusTagType">{{ statusLabel }}</ElTag>
      </div>
      <div class="flex-c gap-2">
        <ElInput
          v-model="tagFilter"
          placeholder="按标签筛选，如 admin:1"
          size="small"
          clearable
          style="width: 200px"
          @keyup.enter="reload"
          @clear="reload"
        />
        <ElButton size="small" @click="reload">筛选</ElButton>
        <ElButton :icon="Refresh" :loading="loading" size="small" circle @click="reload" />
        <ElButton
          v-auth="'debug.manage'"
          size="small"
          :type="status === 'paused' ? 'success' : 'warning'"
          @click="handleToggleRecording"
        >
          {{ status === 'paused' ? '恢复记录' : '暂停记录' }}
        </ElButton>
        <ElButton v-auth="'debug.manage'" size="small" type="danger" @click="handleClear">
          清空记录
        </ElButton>
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-start gap-4">
      <!-- 左侧：类型导航 + 监控标签 -->
      <div class="w-full md:w-44 shrink-0">
        <div class="art-card p-4 mb-4">
          <div class="text-xs uppercase font-bold text-g-500 mb-2">条目类型</div>
          <div class="space-y-0.5">
            <div
              v-for="item in entryTypes"
              :key="item.value"
              class="flex-c gap-2 px-2.5 py-2 rounded-custom-xs cursor-pointer tad-200"
              :class="
                type === item.value
                  ? 'bg-theme/10 text-theme font-medium'
                  : 'text-g-700 hover:bg-hover-color'
              "
              @click="handleTypeChange(item.value)"
            >
              <ArtSvgIcon :icon="item.icon" class="text-base shrink-0" />
              <span class="text-sm truncate">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="art-card p-4">
          <div
            class="text-xs uppercase font-bold text-g-500 mb-2"
            title="命中标签的条目将被强制记录"
          >
            监控标签
          </div>
          <div v-loading="tagsLoading">
            <div v-auth="'debug.manage'" class="flex-c gap-1.5 mb-3">
              <ElInput
                v-model="newTag"
                placeholder="输入标签"
                size="small"
                @keyup.enter="handleMonitorTag"
              />
              <ElButton size="small" type="primary" @click="handleMonitorTag">添加</ElButton>
            </div>
            <p v-if="!monitoredTags.length" class="text-xs text-g-500">暂无监控标签</p>
            <div v-else class="flex flex-wrap gap-1.5">
              <ElTag
                v-for="tag in monitoredTags"
                :key="tag"
                size="small"
                closable
                @close="handleUnmonitorTag(tag)"
              >
                {{ tag }}
              </ElTag>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：条目列表 -->
      <div class="flex-1 min-w-0 w-full">
        <div class="art-card p-5">
          <div class="art-card-header">
            <div class="title">
              <h4>{{ currentTypeLabel }}</h4>
              <p>共加载 {{ entries.length }} 条，按时间倒序</p>
            </div>
          </div>

          <div v-loading="loading" class="mt-3">
            <ElEmpty v-if="!entries.length" description="暂无调试记录" :image-size="60" />
            <div v-else class="space-y-1.5">
              <div
                v-for="entry in entries"
                :key="entry.id"
                class="flex-c gap-3 p-2.5 rounded-custom-xs cursor-pointer hover:bg-hover-color tad-200"
                @click="openDetail(entry)"
              >
                <ElTag v-if="entryBadge(entry)" size="small" :type="entryBadgeType(entry)">
                  {{ entryBadge(entry) }}
                </ElTag>
                <span
                  class="flex-1 text-xs text-g-800 truncate font-mono"
                  :title="entryTitle(entry)"
                >
                  {{ entryTitle(entry) }}
                </span>
                <span v-if="entryMeta(entry)" class="text-xs text-g-500 shrink-0">
                  {{ entryMeta(entry) }}
                </span>
                <span class="text-xs text-g-500 shrink-0 tabular-nums">
                  {{ formatTime(entry.created_at) }}
                </span>
              </div>
            </div>

            <div v-if="nextBefore !== null" class="mt-4 text-center">
              <ElButton size="small" :loading="loadingMore" @click="loadMore">加载更多</ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <ElDrawer v-model="detailVisible" title="条目详情" size="46%" destroy-on-close>
      <div v-loading="detailLoading">
        <template v-if="detail">
          <ElDescriptions :column="1" border size="small">
            <ElDescriptionsItem label="条目 ID">{{ detail.entry.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="类型">{{ typeLabel(detail.entry.type) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="批次 ID">{{ detail.entry.batch_id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="记录时间">{{ detail.entry.created_at }}</ElDescriptionsItem>
            <ElDescriptionsItem v-if="detail.entry.tags.length" label="标签">
              <ElTag v-for="tag in detail.entry.tags" :key="tag" size="small" class="mr-1">
                {{ tag }}
              </ElTag>
            </ElDescriptionsItem>
          </ElDescriptions>

          <div v-if="detail.entry.type === 'exception'" class="mt-3 text-right">
            <ElButton
              v-auth="'debug.manage'"
              size="small"
              type="success"
              :disabled="!!detail.entry.content.resolved_at"
              @click="handleResolve"
            >
              {{ detail.entry.content.resolved_at ? '已解决' : '标记为已解决' }}
            </ElButton>
          </div>

          <div class="mt-4">
            <div class="text-xs uppercase font-bold text-g-500 mb-2">内容</div>
            <pre class="json-block">{{ formatJson(detail.entry.content) }}</pre>
          </div>

          <!-- 同批次关联条目：按类型分 Tab（对齐原版 Telescope RelatedEntries 布局） -->
          <div v-if="relatedGroups.length" class="mt-4 related-entries">
            <ElTabs v-model="relatedTab">
              <ElTabPane
                v-for="group in relatedGroups"
                :key="group.type"
                :name="group.type"
                :label="`${group.label} (${group.entries.length})`"
              >
                <div class="related-head">
                  <div>
                    {{ relatedColumns(group.type)[0] }}
                    <small v-if="group.type === 'query'" class="related-summary">
                      {{ group.entries.length }} 条查询，{{ queriesSummary.duplicated }} 条重复
                    </small>
                  </div>
                  <div class="text-right">
                    {{ relatedColumns(group.type)[1] }}
                    <small v-if="group.type === 'query'" class="related-summary">
                      {{ queriesSummary.time }}ms
                    </small>
                  </div>
                </div>
                <div class="related-body">
                  <div
                    v-for="item in group.entries"
                    :key="item.id"
                    class="related-row"
                    :class="
                      item.id === detail.entry.id
                        ? 'bg-theme/10'
                        : 'cursor-pointer hover:bg-hover-color'
                    "
                    @click="item.id !== detail.entry.id && loadDetail(item.id)"
                  >
                    <div class="min-w-0">
                      <div
                        class="text-xs text-g-800 truncate font-mono"
                        :title="relatedTitle(item)"
                      >
                        {{ relatedTitle(item) }}
                      </div>
                      <div
                        v-if="relatedSubtitle(item)"
                        class="mt-0.5 text-xs text-g-500 truncate"
                        :title="relatedSubtitle(item)"
                      >
                        {{ relatedSubtitle(item) }}
                      </div>
                    </div>
                    <div class="flex-c justify-end gap-2 shrink-0">
                      <span v-if="entryMeta(item)" class="text-xs text-g-500 tabular-nums">
                        {{ entryMeta(item) }}
                      </span>
                      <ElTag
                        v-if="entryBadge(item) !== group.label"
                        size="small"
                        :type="entryBadgeType(item)"
                      >
                        {{ entryBadge(item) }}
                      </ElTag>
                    </div>
                  </div>
                </div>
              </ElTabPane>
            </ElTabs>
          </div>
        </template>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import {
    clearDebugEntries,
    fetchDebugEntries,
    fetchDebugEntry,
    fetchDebugTags,
    monitorDebugTag,
    resolveDebugException,
    toggleDebugRecording,
    unmonitorDebugTag,
    type DebugEntry,
    type DebugEntryResponse,
    type DebugEntryType,
    type DebugStatus
  } from '@/api/debug'
  import { Refresh } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'DebugPanel' })

  /** 条目类型导航配置 */
  const entryTypes: Array<{ value: DebugEntryType; label: string; icon: string }> = [
    { value: 'request', label: '请求', icon: 'ri:exchange-line' },
    { value: 'exception', label: '异常', icon: 'ri:error-warning-line' },
    { value: 'log', label: '日志', icon: 'ri:file-text-line' },
    { value: 'query', label: '数据库', icon: 'ri:database-2-line' },
    { value: 'model', label: '模型', icon: 'ri:box-3-line' },
    { value: 'job', label: '任务', icon: 'ri:task-line' },
    { value: 'batch', label: '批处理', icon: 'ri:stack-line' },
    { value: 'event', label: '事件', icon: 'ri:broadcast-line' },
    { value: 'cache', label: '缓存', icon: 'ri:hard-drive-2-line' },
    { value: 'redis', label: 'Redis', icon: 'ri:server-line' },
    { value: 'mail', label: '邮件', icon: 'ri:mail-line' },
    { value: 'notification', label: '通知', icon: 'ri:notification-3-line' },
    { value: 'gate', label: '授权', icon: 'ri:shield-keyhole-line' },
    { value: 'command', label: '命令', icon: 'ri:terminal-box-line' },
    { value: 'schedule', label: '调度', icon: 'ri:calendar-schedule-line' },
    { value: 'view', label: '视图', icon: 'ri:layout-line' },
    { value: 'dump', label: 'Dump', icon: 'ri:code-box-line' },
    { value: 'client_request', label: '外部请求', icon: 'ri:global-line' }
  ]

  const type = ref<DebugEntryType>('request')
  const status = ref<DebugStatus>('enabled')
  const entries = ref<DebugEntry[]>([])
  const nextBefore = ref<number | null>(null)
  const tagFilter = ref('')
  const loading = ref(false)
  const loadingMore = ref(false)

  const monitoredTags = ref<string[]>([])
  const newTag = ref('')
  const tagsLoading = ref(false)

  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<DebugEntryResponse | null>(null)
  /** 当前激活的关联条目 Tab（对应条目类型） */
  const relatedTab = ref('')

  /** 关联条目 Tab 顺序，与原版 Telescope 保持一致 */
  const relatedTabOrder: DebugEntryType[] = [
    'exception',
    'log',
    'view',
    'query',
    'model',
    'gate',
    'job',
    'mail',
    'notification',
    'event',
    'cache',
    'redis',
    'client_request'
  ]

  /** 同批次关联条目按类型分组（排除 request / command 自身入口类型） */
  const relatedGroups = computed(() => {
    const batch = detail.value?.batch ?? []
    return relatedTabOrder
      .map((groupType) => ({
        type: groupType,
        label: typeLabel(groupType),
        entries: batch.filter((item) => item.type === groupType)
      }))
      .filter((group) => group.entries.length > 0)
  })

  /** 查询类关联条目汇总（总耗时与重复条数） */
  const queriesSummary = computed(() => {
    const queries = detail.value?.batch.filter((item) => item.type === 'query') ?? []
    const time = queries.reduce((total, item) => total + parseFloat(item.content.time ?? 0), 0)
    const uniqueHashes = new Set(
      queries.map((item) => `${item.content.hash}-${item.content.connection}`)
    )
    return { time: time.toFixed(2), duplicated: queries.length - uniqueHashes.size }
  })

  /** 各类型关联条目的表头文案 [左列, 右列] */
  function relatedColumns(groupType: string): [string, string] {
    const map: Record<string, [string, string]> = {
      exception: ['异常信息', '位置'],
      log: ['日志内容', '级别'],
      view: ['视图', 'Composer 数'],
      query: ['查询语句', '耗时'],
      model: ['模型', '动作'],
      gate: ['权限', '结果'],
      job: ['任务', '状态'],
      mail: ['邮件', '状态'],
      notification: ['通知', '渠道'],
      event: ['事件', '监听器数'],
      cache: ['键名', '动作'],
      redis: ['命令', '耗时'],
      client_request: ['请求地址', '状态']
    }
    return map[groupType] ?? ['内容', '状态']
  }

  /** 关联条目主标题 */
  function relatedTitle(entry: DebugEntry): string {
    if (entry.type === 'exception') {
      return String(entry.content.class ?? '')
    }
    if (entry.type === 'mail') {
      return String(entry.content.mailable ?? '-')
    }
    if (entry.type === 'notification') {
      return String(entry.content.notification ?? '-')
    }
    return entryTitle(entry)
  }

  /** 关联条目副标题 */
  function relatedSubtitle(entry: DebugEntry): string {
    switch (entry.type) {
      case 'exception':
        return String(entry.content.message ?? '')
      case 'job':
        return `连接：${entry.content.connection ?? '-'} | 队列：${entry.content.queue ?? '-'}`
      case 'mail':
        return `主题：${entry.content.subject ?? '-'}`
      case 'notification':
        return `接收者：${entry.content.notifiable ?? '-'}`
      case 'view':
        return String(entry.content.path ?? '')
      default:
        return ''
    }
  }

  /** 类型对应的中文名 */
  function typeLabel(value: string): string {
    return entryTypes.find((item) => item.value === value)?.label ?? value
  }

  const currentTypeLabel = computed(() => typeLabel(type.value))

  const statusLabel = computed(() => {
    const map: Record<DebugStatus, string> = {
      enabled: '采集中',
      paused: '已暂停',
      disabled: '已禁用',
      off: '该类型未启用'
    }
    return map[status.value]
  })

  const statusTagType = computed<'success' | 'warning' | 'info' | 'danger'>(() => {
    switch (status.value) {
      case 'enabled':
        return 'success'
      case 'paused':
        return 'warning'
      case 'off':
        return 'info'
      default:
        return 'danger'
    }
  })

  /** 相对时间显示 */
  function formatTime(time: string): string {
    const diff = Date.now() - new Date(time.replace(' ', 'T')).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${Math.max(seconds, 0)}秒前`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  /** JSON 美化输出 */
  function formatJson(content: unknown): string {
    return JSON.stringify(content, null, 2)
  }

  /** 条目左侧徽标文本（HTTP 方法 / 日志级别等） */
  function entryBadge(entry: DebugEntry): string {
    const content = entry.content
    switch (entry.type) {
      case 'request':
      case 'client_request':
        return String(content.method ?? '')
      case 'log':
        return String(content.level ?? '')
      case 'query':
        return content.slow ? 'SLOW' : 'SQL'
      case 'model':
        return String(content.action ?? '')
      case 'cache':
        return String(content.type ?? '')
      case 'job':
      case 'batch':
        return String(content.status ?? '')
      case 'gate':
        return String(content.result ?? '')
      default:
        return typeLabel(entry.type)
    }
  }

  /** 徽标颜色 */
  function entryBadgeType(
    entry: DebugEntry
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
    const badge = entryBadge(entry).toUpperCase()
    if (['GET', 'PROCESSED', 'ALLOWED', 'HIT'].includes(badge)) return 'success'
    if (['POST', 'PUT', 'PATCH', 'WARNING', 'SLOW', 'PENDING'].includes(badge)) return 'warning'
    if (['DELETE', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'FAILED', 'DENIED'].includes(badge)) {
      return 'danger'
    }
    return 'info'
  }

  /** 条目主标题 */
  function entryTitle(entry: DebugEntry): string {
    const content = entry.content
    switch (entry.type) {
      case 'request':
      case 'client_request':
        return String(content.uri ?? '')
      case 'exception':
        return `${content.class ?? ''}: ${content.message ?? ''}`
      case 'log':
        return String(content.message ?? '')
      case 'query':
        return String(content.sql ?? '')
      case 'model':
        return String(content.model ?? '')
      case 'job':
        return String(content.name ?? '')
      case 'batch':
        return String(content.name ?? content.batchId ?? '')
      case 'event':
        return String(content.name ?? '')
      case 'cache':
      case 'redis':
        return String(content.key ?? content.command ?? '')
      case 'mail':
        return String(content.subject ?? '')
      case 'notification':
        return String(content.notification ?? '')
      case 'gate':
        return String(content.ability ?? '')
      case 'command':
        return String(content.command ?? '')
      case 'schedule':
        return String(content.command ?? '')
      case 'view':
        return String(content.name ?? content.path ?? '')
      case 'dump':
        return String(content.dump ?? '').slice(0, 200)
      default:
        return formatJson(content).slice(0, 200)
    }
  }

  /** 条目右侧附加信息（状态码 / 耗时等） */
  function entryMeta(entry: DebugEntry): string {
    const content = entry.content
    switch (entry.type) {
      case 'request':
      case 'client_request':
        return [content.response_status, content.duration ? `${content.duration}ms` : '']
          .filter(Boolean)
          .join(' · ')
      case 'query':
        return content.time ? `${content.time}ms` : ''
      case 'job':
      case 'command':
      case 'schedule':
        return content.duration ? `${content.duration}ms` : ''
      case 'exception':
        return String(content.line ? `line ${content.line}` : '')
      default:
        return ''
    }
  }

  /** 加载条目列表 */
  async function loadEntries(before?: number): Promise<void> {
    const isMore = before !== undefined
    if (isMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const res = await fetchDebugEntries({
        type: type.value,
        tag: tagFilter.value.trim() || undefined,
        before,
        take: 50
      })
      status.value = res.status
      entries.value = isMore ? [...entries.value, ...res.entries] : res.entries
      nextBefore.value = res.entries.length ? res.next_before : null
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  /** 重新加载（重置游标） */
  function reload(): void {
    nextBefore.value = null
    loadEntries()
  }

  /** 加载下一页 */
  function loadMore(): void {
    if (nextBefore.value === null) return
    loadEntries(nextBefore.value)
  }

  /** 切换条目类型 */
  function handleTypeChange(value: DebugEntryType): void {
    if (type.value === value) return
    type.value = value
    entries.value = []
    reload()
  }

  /** 加载监控标签 */
  async function loadTags(): Promise<void> {
    tagsLoading.value = true
    try {
      const res = await fetchDebugTags()
      monitoredTags.value = res.tags
    } finally {
      tagsLoading.value = false
    }
  }

  /** 新增监控标签 */
  async function handleMonitorTag(): Promise<void> {
    const tag = newTag.value.trim()
    if (!tag) {
      ElMessage.warning('请输入标签')
      return
    }
    const res = await monitorDebugTag(tag)
    monitoredTags.value = res.tags
    newTag.value = ''
  }

  /** 移除监控标签 */
  async function handleUnmonitorTag(tag: string): Promise<void> {
    const res = await unmonitorDebugTag(tag)
    monitoredTags.value = res.tags
  }

  /** 切换记录开关 */
  async function handleToggleRecording(): Promise<void> {
    const res = await toggleDebugRecording()
    ElMessage.success(res.message)
    reload()
  }

  /** 清空全部调试记录 */
  async function handleClear(): Promise<void> {
    await ElMessageBox.confirm('将删除全部调试记录，此操作不可恢复，是否继续？', '清空记录', {
      type: 'warning'
    })
    await clearDebugEntries()
    entries.value = []
    nextBefore.value = null
  }

  /** 加载条目详情 */
  async function loadDetail(id: string): Promise<void> {
    detailLoading.value = true
    try {
      detail.value = await fetchDebugEntry(id)
      relatedTab.value = relatedGroups.value[0]?.type ?? ''
    } finally {
      detailLoading.value = false
    }
  }

  /** 打开详情抽屉 */
  function openDetail(entry: DebugEntry): void {
    detail.value = null
    detailVisible.value = true
    loadDetail(entry.id)
  }

  /** 标记异常已解决 */
  async function handleResolve(): Promise<void> {
    if (!detail.value) return
    const res = await resolveDebugException(detail.value.entry.id)
    detail.value = { ...detail.value, entry: res.entry }
    reload()
  }

  onMounted(() => {
    loadEntries()
    loadTags()
  })
</script>

<style scoped>
  .debug-panel {
    padding: 4px;
  }

  .related-entries :deep(.el-tabs__content) {
    min-height: 160px;
    max-height: 320px;
    overflow-y: auto;
  }

  .related-head {
    @apply flex-c px-3 py-2 border-b-d text-xs font-medium text-g-500;

    .related-summary {
      @apply ml-2 font-normal text-g-400;
    }
  }

  .related-row {
    @apply flex-c gap-3 px-3 py-2 border-b-d tad-200;

    &:last-child {
      border-bottom: 0;
    }
  }

  .json-block {
    max-height: 420px;
    padding: 12px;
    overflow: auto;
    font-family: var(--el-font-family-mono, monospace);
    font-size: 12px;
    line-height: 1.6;
    color: var(--art-gray-800);
    word-break: break-all;
    white-space: pre-wrap;
    background: var(--art-gray-100);
    border-radius: 6px;
  }
</style>
