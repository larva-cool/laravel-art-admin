<template>
  <div class="pulse-monitor">
    <!-- 顶部工具栏 -->
    <div class="art-card p-4 mb-4 flex-cb">
      <div class="flex-c gap-2">
        <ArtSvgIcon icon="ri:pulse-line" class="text-lg text-theme" />
        <h3 class="text-base font-medium text-g-900">性能监控</h3>
      </div>
      <div class="flex-c gap-3">
        <ElRadioGroup v-model="period" size="small" @change="refreshAll">
          <ElRadioButton value="1_hour">1h</ElRadioButton>
          <ElRadioButton value="6_hours">6h</ElRadioButton>
          <ElRadioButton value="24_hours">24h</ElRadioButton>
          <ElRadioButton value="7_days">7d</ElRadioButton>
        </ElRadioGroup>
        <ElButton :icon="Refresh" :loading="loading" size="small" circle @click="refreshAll" />
      </div>
    </div>

    <!-- 服务器资源（全宽） -->
    <div class="art-card p-5 mb-4">
      <div class="art-card-header">
        <div class="title">
          <h4>服务器资源</h4>
          <p>CPU · 内存 · 磁盘</p>
        </div>
      </div>
      <div v-loading="serversLoading" class="mt-3">
        <ElEmpty v-if="!servers.length" description="暂无服务器数据" :image-size="60" />
        <div v-else>
          <!-- 表头 -->
          <div
            class="hidden lg:grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1.5fr)_auto_minmax(0,1.5fr)_minmax(0,1fr)] gap-x-4 px-2 pb-2 border-b-d text-xs uppercase font-bold text-g-500"
          >
            <div class="w-5"></div>
            <div>服务器</div>
            <div class="w-14 text-right">CPU</div>
            <div></div>
            <div class="w-28 text-right">内存</div>
            <div></div>
            <div>存储</div>
          </div>
          <!-- 服务器行 -->
          <div
            v-for="server in servers"
            :key="server.slug"
            class="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1.5fr)_auto_minmax(0,1.5fr)_minmax(0,1fr)] gap-x-4 gap-y-2 items-center py-3 border-b-d last:border-b-0"
            :class="!server.recently_reported ? 'opacity-40' : ''"
          >
            <!-- 状态指示灯 -->
            <div class="flex-cc w-5" :title="server.updated_at">
              <div
                class="rounded-full"
                :class="
                  server.recently_reported
                    ? 'w-1.5 h-1.5 bg-success animate-pulse'
                    : 'w-2 h-2 bg-danger'
                "
              />
            </div>
            <!-- 服务器名称 -->
            <div class="flex-c gap-2 min-w-0">
              <ArtSvgIcon icon="ri:server-line" class="text-lg text-g-500 shrink-0" />
              <span class="text-sm font-medium text-g-800 truncate">{{ server.name }}</span>
            </div>
            <!-- CPU 数值 -->
            <div
              class="text-lg font-bold text-g-800 tabular-nums w-14 text-right whitespace-nowrap"
            >
              {{ server.cpu_current }}%
            </div>
            <!-- CPU 图 -->
            <div class="h-9 min-w-0">
              <PulseSparkline :data="server.cpu" :max="100" />
            </div>
            <!-- 内存数值 -->
            <div class="w-28 text-right whitespace-nowrap tabular-nums">
              <span class="text-lg font-bold text-g-800">{{
                friendlySize(server.memory_current, 1)
              }}</span>
              <span class="text-sm text-g-500">/ {{ friendlySize(server.memory_total, 1) }}</span>
            </div>
            <!-- 内存图 -->
            <div class="h-9 min-w-0">
              <PulseSparkline :data="server.memory" :max="server.memory_total" />
            </div>
            <!-- 存储 -->
            <div class="flex-c gap-4 flex-wrap">
              <div v-for="disk in server.storage" :key="disk.directory" class="flex-c gap-2">
                <ElProgress
                  type="dashboard"
                  :percentage="diskPercentage(disk)"
                  :width="40"
                  :stroke-width="4"
                  :color="diskColor(diskPercentage(disk))"
                />
                <div class="text-xs whitespace-nowrap tabular-nums">
                  <span class="font-bold text-g-800">{{ friendlySize(disk.used) }}</span>
                  <span class="text-g-500">/ {{ friendlySize(disk.total) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第二行：使用量 + 队列 + 缓存 -->
    <ElRow :gutter="20" class="mb-4">
      <!-- 用户使用量 -->
      <ElCol :xs="24" :md="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>用户使用量</h4>
              <p>Top 10 排行</p>
            </div>
            <ElSelect v-model="usageType" size="small" style="width: 110px" @change="fetchUsage">
              <ElOption label="请求数" value="requests" />
              <ElOption label="慢请求" value="slow_requests" />
              <ElOption label="任务数" value="jobs" />
            </ElSelect>
          </div>
          <div v-loading="usageLoading" class="mt-3">
            <ElEmpty v-if="!usage.length" description="暂无数据" :image-size="60" />
            <div v-else class="space-y-1.5">
              <div
                v-for="(user, index) in usage"
                :key="user.key"
                class="flex-c gap-3 p-2 rounded-custom-xs hover:bg-hover-color tad-200"
              >
                <span
                  class="text-xs font-medium w-5 h-5 rounded-full flex-cc shrink-0"
                  :class="index < 3 ? 'bg-theme text-white' : 'text-g-500 bg-[var(--art-gray-200)]'"
                >
                  {{ index + 1 }}
                </span>
                <ElAvatar :size="30" :src="user.avatar ?? undefined">
                  {{ user.name?.charAt(0) ?? '?' }}
                </ElAvatar>
                <span class="flex-1 text-sm text-g-700 truncate">{{ user.name ?? user.key }}</span>
                <span class="text-base font-medium text-g-900 tabular-nums">{{
                  formatNumber(user.count)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </ElCol>

      <!-- 队列吞吐 -->
      <ElCol :xs="24" :md="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>队列吞吐</h4>
              <p>实时队列状态</p>
            </div>
            <div class="flex-c gap-2.5 text-xs text-g-500">
              <span class="flex-c gap-1"
                ><i
                  class="legend-dot"
                  style="background: var(--color-g-400); opacity: 0.5"
                />入队</span
              >
              <span class="flex-c gap-1"
                ><i
                  class="legend-dot"
                  style="background: var(--color-secondary); opacity: 0.5"
                />处理中</span
              >
              <span class="flex-c gap-1"
                ><i class="legend-dot" style="background: var(--color-primary)" />已处理</span
              >
              <span class="flex-c gap-1"
                ><i class="legend-dot" style="background: var(--color-warning)" />重试</span
              >
              <span class="flex-c gap-1"
                ><i class="legend-dot" style="background: var(--color-danger)" />失败</span
              >
            </div>
          </div>
          <div v-loading="queuesLoading" class="mt-3">
            <ElEmpty v-if="!queues.length" description="暂无队列数据" :image-size="60" />
            <div v-else class="space-y-3">
              <div v-for="queue in queues" :key="queue.key">
                <div class="text-sm font-medium text-g-700 mb-1.5">{{
                  queue.queue || queue.key
                }}</div>
                <div class="h-14 rounded-custom-xs bg-[var(--art-gray-100)] p-1">
                  <PulseMultiLine
                    :series="[
                      {
                        name: '入队',
                        data: extractValues(queue.queued),
                        color: 'var(--color-g-400)'
                      },
                      {
                        name: '处理中',
                        data: extractValues(queue.processing),
                        color: 'var(--color-secondary)'
                      },
                      {
                        name: '已处理',
                        data: extractValues(queue.processed),
                        color: 'var(--color-primary)'
                      },
                      {
                        name: '已重试',
                        data: extractValues(queue.released),
                        color: 'var(--color-warning)'
                      },
                      {
                        name: '失败',
                        data: extractValues(queue.failed),
                        color: 'var(--color-danger)'
                      }
                    ]"
                    :labels="extractLabels(queue.queued)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElCol>

      <!-- 缓存命中率 -->
      <ElCol :xs="24" :md="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>缓存命中率</h4>
              <p>缓存性能指标</p>
            </div>
          </div>
          <div v-loading="cacheLoading" class="mt-3">
            <ElEmpty
              v-if="cache.hits === 0 && cache.misses === 0"
              description="暂无数据"
              :image-size="60"
            />
            <div v-else>
              <div class="grid grid-cols-3 gap-2 text-center mb-4">
                <div class="p-2 rounded-custom-xs bg-[var(--art-gray-100)]">
                  <div class="text-xl font-medium text-g-900 tabular-nums">{{
                    formatNumber(cache.hits)
                  }}</div>
                  <div class="text-xs text-g-500 mt-0.5">命中</div>
                </div>
                <div class="p-2 rounded-custom-xs bg-[var(--art-gray-100)]">
                  <div class="text-xl font-medium text-g-900 tabular-nums">{{
                    formatNumber(cache.misses)
                  }}</div>
                  <div class="text-xs text-g-500 mt-0.5">未命中</div>
                </div>
                <div class="p-2 rounded-custom-xs bg-theme/10">
                  <div class="text-xl font-medium text-theme tabular-nums">{{ cacheHitRate }}%</div>
                  <div class="text-xs text-g-500 mt-0.5">命中率</div>
                </div>
              </div>
              <ArtTable :data="cache.keys" :columns="cacheColumns" :showPagination="false" />
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 慢查询 + 异常 -->
    <ElRow :gutter="20" class="mb-4">
      <ElCol :xs="24" :lg="16">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>慢查询</h4>
              <p>数据库性能瓶颈</p>
            </div>
            <ElSelect
              v-model="slowQueryOrderBy"
              size="small"
              style="width: 100px"
              @change="fetchSlowQueries"
            >
              <ElOption label="最慢" value="slowest" />
              <ElOption label="次数" value="count" />
            </ElSelect>
          </div>
          <div v-loading="slowQueriesLoading" class="mt-3">
            <ElEmpty v-if="!slowQueries.length" description="暂无慢查询" :image-size="60" />
            <div
              v-else
              :class="['space-y-2', slowQueries.length > 5 ? 'overflow-y-auto max-h-96 pr-1' : '']"
            >
              <div
                v-for="query in slowQueries"
                :key="`${query.sql}-${query.location}`"
                class="rounded-custom-sm bg-[var(--art-gray-100)] p-3 tad-200 hover:bg-[var(--art-gray-200)]"
              >
                <code class="text-xs text-g-800 break-all block font-mono">{{ query.sql }}</code>
                <div class="flex-cb mt-2">
                  <span v-if="query.location" class="text-xs text-g-500">{{ query.location }}</span>
                  <div class="flex-c gap-3 ml-auto">
                    <span class="text-xs text-g-600"
                      >次数 <strong class="text-g-800">{{ query.count }}</strong></span
                    >
                    <ElTag size="small" type="warning">{{ query.slowest || '<1' }} ms</ElTag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xs="24" :lg="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>异常统计</h4>
              <p>异常捕获记录</p>
            </div>
            <ElSelect
              v-model="exceptionsOrderBy"
              size="small"
              style="width: 100px"
              @change="fetchExceptions"
            >
              <ElOption label="次数" value="count" />
              <ElOption label="最近" value="latest" />
            </ElSelect>
          </div>
          <div v-loading="exceptionsLoading" class="mt-3">
            <ElEmpty v-if="!exceptions.length" description="暂无异常" :image-size="60" />
            <div
              v-else
              :class="['space-y-1.5', exceptions.length > 5 ? 'overflow-y-auto max-h-96 pr-1' : '']"
            >
              <div
                v-for="item in exceptions"
                :key="`${item.class}-${item.location}`"
                class="p-2.5 rounded-custom-xs hover:bg-hover-color tad-200"
              >
                <code class="text-xs text-g-800 break-all block font-mono" :title="item.class">{{
                  item.class
                }}</code>
                <div class="flex-cb mt-1">
                  <span
                    v-if="item.location"
                    class="text-xs text-g-500 truncate max-w-[60%]"
                    :title="item.location"
                  >
                    {{ item.location }}
                  </span>
                  <div class="flex-c gap-2 shrink-0">
                    <span class="text-xs text-g-500">{{ formatTime(item.latest) }}</span>
                    <ElTag size="small" type="danger">{{ item.count }}</ElTag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 慢请求 + 慢任务 + 慢外部请求 -->
    <ElRow :gutter="20">
      <ElCol :xs="24" :lg="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>慢请求</h4>
              <p>HTTP 路由耗时</p>
            </div>
            <ElSelect
              v-model="slowReqOrderBy"
              size="small"
              style="width: 100px"
              @change="fetchSlowRequests"
            >
              <ElOption label="最慢" value="slowest" />
              <ElOption label="次数" value="count" />
            </ElSelect>
          </div>
          <div v-loading="slowRequestsLoading" class="mt-3">
            <ElEmpty v-if="!slowRequests.length" description="暂无慢请求" :image-size="60" />
            <div v-else class="space-y-1.5">
              <div
                v-for="item in slowRequests"
                :key="`${item.method}-${item.uri}`"
                class="flex-c gap-2 p-2.5 rounded-custom-xs hover:bg-hover-color tad-200"
              >
                <ElTag size="small" :type="methodTagType(item.method)">{{ item.method }}</ElTag>
                <span class="flex-1 text-xs text-g-700 truncate font-mono">{{ item.uri }}</span>
                <span class="text-xs text-g-500 shrink-0">{{ item.count }}次</span>
                <ElTag size="small" type="warning">{{ item.slowest }}ms</ElTag>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xs="24" :lg="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>慢任务</h4>
              <p>队列任务耗时</p>
            </div>
            <ElSelect
              v-model="slowJobOrderBy"
              size="small"
              style="width: 100px"
              @change="fetchSlowJobs"
            >
              <ElOption label="最慢" value="slowest" />
              <ElOption label="次数" value="count" />
            </ElSelect>
          </div>
          <div v-loading="slowJobsLoading" class="mt-3">
            <ElEmpty v-if="!slowJobs.length" description="暂无慢任务" :image-size="60" />
            <div v-else class="space-y-1.5">
              <div
                v-for="item in slowJobs"
                :key="item.job"
                class="flex-c gap-2 p-2.5 rounded-custom-xs hover:bg-hover-color tad-200"
              >
                <span class="flex-1 text-xs text-g-700 truncate font-mono">{{ item.job }}</span>
                <span class="text-xs text-g-500 shrink-0">{{ item.count }}次</span>
                <ElTag size="small" type="warning">{{ item.slowest }}ms</ElTag>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xs="24" :lg="8">
        <div class="art-card p-5 h-full">
          <div class="art-card-header">
            <div class="title">
              <h4>慢外部请求</h4>
              <p> outgoing HTTP 耗时</p>
            </div>
            <ElSelect
              v-model="slowOutgoingOrderBy"
              size="small"
              style="width: 100px"
              @change="fetchSlowOutgoingRequests"
            >
              <ElOption label="最慢" value="slowest" />
              <ElOption label="次数" value="count" />
            </ElSelect>
          </div>
          <div v-loading="slowOutgoingLoading" class="mt-3">
            <ElEmpty
              v-if="!slowOutgoingRequests.length"
              description="暂无慢外部请求"
              :image-size="60"
            />
            <div v-else class="space-y-1.5">
              <div
                v-for="item in slowOutgoingRequests"
                :key="`${item.method}-${item.uri}`"
                class="flex-c gap-2 p-2.5 rounded-custom-xs hover:bg-hover-color tad-200"
              >
                <ElTag size="small" :type="methodTagType(item.method)">{{ item.method }}</ElTag>
                <span class="flex-1 text-xs text-g-700 truncate font-mono">{{ item.uri }}</span>
                <span class="text-xs text-g-500 shrink-0">{{ item.count }}次</span>
                <ElTag size="small" type="warning">{{ item.slowest }}ms</ElTag>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchPulseCache,
    fetchPulseExceptions,
    fetchPulseQueues,
    fetchPulseServers,
    fetchPulseSlowJobs,
    fetchPulseSlowOutgoingRequests,
    fetchPulseSlowQueries,
    fetchPulseSlowRequests,
    fetchPulseUsage,
    type PulseCacheResponse,
    type PulseExceptionItem,
    type PulsePeriod,
    type PulseQueue,
    type PulseSeriesPoint,
    type PulseServer,
    type PulseSlowJobItem,
    type PulseSlowOutgoingRequestItem,
    type PulseSlowQueryItem,
    type PulseSlowRequestItem,
    type PulseUsageItem
  } from '@/api/monitor'
  import { Refresh } from '@element-plus/icons-vue'

  defineOptions({ name: 'PulseMonitor' })

  // ----- 周期与全局状态 -----
  const period = ref<PulsePeriod>('1_hour')
  const loading = ref(false)
  const isFirstLoad = ref(true)

  // ----- 数据 -----
  const servers = ref<PulseServer[]>([])
  const queues = ref<PulseQueue[]>([])
  const cache = ref<PulseCacheResponse['all'] & { keys: any[] }>({ hits: 0, misses: 0, keys: [] })
  const exceptions = ref<PulseExceptionItem[]>([])
  const slowQueries = ref<PulseSlowQueryItem[]>([])
  const slowRequests = ref<PulseSlowRequestItem[]>([])
  const slowJobs = ref<PulseSlowJobItem[]>([])
  const slowOutgoingRequests = ref<PulseSlowOutgoingRequestItem[]>([])
  const usage = ref<PulseUsageItem[]>([])

  // ----- 排序与类型 -----
  const usageType = ref<'requests' | 'slow_requests' | 'jobs'>('requests')
  const slowQueryOrderBy = ref<'slowest' | 'count'>('slowest')
  const exceptionsOrderBy = ref<'count' | 'latest'>('count')
  const slowReqOrderBy = ref<'slowest' | 'count'>('slowest')
  const slowJobOrderBy = ref<'slowest' | 'count'>('slowest')
  const slowOutgoingOrderBy = ref<'slowest' | 'count'>('slowest')

  // ----- 独立 loading -----
  const serversLoading = ref(false)
  const queuesLoading = ref(false)
  const cacheLoading = ref(false)
  const exceptionsLoading = ref(false)
  const slowQueriesLoading = ref(false)
  const slowRequestsLoading = ref(false)
  const slowJobsLoading = ref(false)
  const slowOutgoingLoading = ref(false)
  const usageLoading = ref(false)

  // ===== 工具函数 =====

  /** 将 MB 转为友好显示 */
  function friendlySize(mb: number, precision = 0): string {
    if (mb >= 1024 * 1024) return `${(mb / 1024 / 1024).toFixed(precision)}TB`
    if (mb >= 1024) return `${(mb / 1024).toFixed(precision)}GB`
    return `${Math.round(mb)}MB`
  }

  /** 格式化数字（千分位） */
  function formatNumber(n: number): string {
    return n.toLocaleString('en-US')
  }

  /** 格式化时间为相对时间 */
  function formatTime(time: string): string {
    const date = new Date(time)
    const diff = Date.now() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${seconds}秒前`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  /** 磁盘使用率 */
  function diskPercentage(disk: { total: number; used: number }): number {
    if (disk.total === 0) return 0
    return Math.round((disk.used / disk.total) * 100)
  }

  /** 磁盘进度条颜色 */
  function diskColor(pct: number): string {
    if (pct >= 90) return '#f56c6c'
    if (pct >= 70) return '#e6a23c'
    return '#67c23a'
  }

  /** 缓存总命中率 */
  const cacheHitRate = computed(() => {
    const total = cache.value.hits + cache.value.misses
    if (total === 0) return '0.00'
    return ((cache.value.hits / total) * 100).toFixed(2)
  })

  /** 单个 key 命中率 */
  function keyHitRate(row: any): string {
    const total = row.hits + row.misses
    if (total === 0) return '0.00'
    return ((row.hits / total) * 100).toFixed(2)
  }

  /** 从 series 提取 values 数组 */
  function extractValues(series: PulseSeriesPoint[]): number[] {
    return series.map((p) => p.value ?? 0)
  }

  /** 从 series 提取 labels 数组 */
  function extractLabels(series: PulseSeriesPoint[]): string[] {
    return series.map((p) => p.time)
  }

  /** HTTP 方法对应的 Tag 类型 */
  function methodTagType(method: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'success'
      case 'POST':
        return 'warning'
      case 'PUT':
      case 'PATCH':
        return 'primary'
      case 'DELETE':
        return 'danger'
      default:
        return 'info'
    }
  }

  /** 缓存 key 表格列配置 */
  const cacheColumns = [
    { prop: 'key', label: 'Key', minWidth: 200, showOverflowTooltip: true },
    { prop: 'hits', label: '命中', width: 80, align: 'right' as const },
    { prop: 'misses', label: '未命中', width: 80, align: 'right' as const },
    {
      prop: 'hitRate',
      label: '命中率',
      width: 80,
      align: 'right' as const,
      formatter: (row: any) => `${keyHitRate(row)}%`
    }
  ]

  // ===== API 请求 =====

  /** 仅首次加载时设置 loading */
  function startLoading(ref: Ref<boolean>) {
    if (isFirstLoad.value) ref.value = true
  }
  function stopLoading(ref: Ref<boolean>) {
    ref.value = false
  }

  async function fetchServers() {
    startLoading(serversLoading)
    try {
      const res = await fetchPulseServers({ period: period.value })
      servers.value = res.servers
    } finally {
      serversLoading.value = false
    }
  }

  async function fetchQueues() {
    startLoading(queuesLoading)
    try {
      const res = await fetchPulseQueues({ period: period.value })
      queues.value = res.queues
    } finally {
      stopLoading(queuesLoading)
    }
  }

  async function fetchCache() {
    startLoading(cacheLoading)
    try {
      const res = await fetchPulseCache({ period: period.value })
      cache.value = { ...res.all, keys: res.keys }
    } finally {
      stopLoading(cacheLoading)
    }
  }

  async function fetchExceptions() {
    startLoading(exceptionsLoading)
    try {
      const res = await fetchPulseExceptions({
        period: period.value,
        order_by: exceptionsOrderBy.value
      })
      exceptions.value = res.exceptions
    } finally {
      stopLoading(exceptionsLoading)
    }
  }

  async function fetchSlowQueries() {
    startLoading(slowQueriesLoading)
    try {
      const res = await fetchPulseSlowQueries({
        period: period.value,
        order_by: slowQueryOrderBy.value
      })
      slowQueries.value = res.slow_queries
    } finally {
      stopLoading(slowQueriesLoading)
    }
  }

  async function fetchSlowRequests() {
    startLoading(slowRequestsLoading)
    try {
      const res = await fetchPulseSlowRequests({
        period: period.value,
        order_by: slowReqOrderBy.value
      })
      slowRequests.value = res.slow_requests
    } finally {
      stopLoading(slowRequestsLoading)
    }
  }

  async function fetchSlowJobs() {
    startLoading(slowJobsLoading)
    try {
      const res = await fetchPulseSlowJobs({ period: period.value, order_by: slowJobOrderBy.value })
      slowJobs.value = res.slow_jobs
    } finally {
      stopLoading(slowJobsLoading)
    }
  }

  async function fetchSlowOutgoingRequests() {
    startLoading(slowOutgoingLoading)
    try {
      const res = await fetchPulseSlowOutgoingRequests({
        period: period.value,
        order_by: slowOutgoingOrderBy.value
      })
      slowOutgoingRequests.value = res.slow_outgoing_requests
    } finally {
      stopLoading(slowOutgoingLoading)
    }
  }

  async function fetchUsage() {
    startLoading(usageLoading)
    try {
      const res = await fetchPulseUsage({ period: period.value, type: usageType.value })
      usage.value = res.users
    } finally {
      stopLoading(usageLoading)
    }
  }

  /** 切换周期或手动刷新时，触发所有接口重新拉取 */
  function refreshAll() {
    Promise.all([
      fetchServers(),
      fetchQueues(),
      fetchCache(),
      fetchExceptions(),
      fetchSlowQueries(),
      fetchSlowRequests(),
      fetchSlowJobs(),
      fetchSlowOutgoingRequests(),
      fetchUsage()
    ])
  }

  // ===== 生命周期与轮询 =====

  /** 各接口独立的轮询定时器 */
  const pollTimers: ReturnType<typeof setInterval>[] = []

  /** 注册一个接口的轮询，首次立即执行，之后每 interval 毫秒执行一次 */
  function startPoll(fetchFn: () => Promise<void>, interval: number): void {
    fetchFn()
    pollTimers.push(setInterval(fetchFn, interval))
  }

  onMounted(() => {
    // 服务器资源：5s
    startPoll(fetchServers, 5000)
    // 队列吞吐：5s
    startPoll(fetchQueues, 5000)
    // 缓存命中：5s
    startPoll(fetchCache, 5000)
    // 异常统计：10s（变化频率较低）
    startPoll(fetchExceptions, 10000)
    // 慢查询：10s
    startPoll(fetchSlowQueries, 10000)
    // 慢请求：10s
    startPoll(fetchSlowRequests, 10000)
    // 慢任务：10s
    startPoll(fetchSlowJobs, 10000)
    // 慢外部请求：10s
    startPoll(fetchSlowOutgoingRequests, 10000)
    // 用户使用量：15s（变化频率最低）
    startPoll(fetchUsage, 15000)

    // 首次加载完成后关闭全局 loading
    Promise.all([fetchServers(), fetchQueues(), fetchCache()]).then(() => {
      if (isFirstLoad.value) {
        isFirstLoad.value = false
        loading.value = false
      }
    })
  })

  onBeforeUnmount(() => {
    pollTimers.forEach(clearInterval)
    pollTimers.length = 0
  })
</script>

<script lang="ts">
  /**
   * PulseSparkline - 迷你折线图（用于 CPU / 内存趋势）
   */
  import { echarts, type EChartsOption } from '@/plugins/echarts'
  import { useSettingStore } from '@/store/modules/setting'
  import { getCssVar, hexToRgba } from '@/utils/ui'
  import { storeToRefs } from 'pinia'
  import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

  /** 确保返回有效的 hex 颜色，否则回退到默认主题色 */
  function safeHex(color: string): string {
    const c = color.trim()
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(c)) return c
    return '#409eff'
  }

  /** 获取主题色 hex 值 */
  function themeColor(): string {
    return safeHex(getCssVar('--el-color-primary-light-1'))
  }

  /** 将 CSS 变量字符串解析为有效 hex */
  function resolveHex(color: string): string {
    if (color.startsWith('var(')) {
      const varName = color.match(/var\((--[^)]+)\)/)?.[1]
      if (varName) return safeHex(getCssVar(varName))
    }
    return safeHex(color)
  }

  /** 暗黑模式 tooltip 配置 */
  function tooltipStyle(isDark: boolean) {
    return {
      trigger: 'axis' as const,
      backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
      borderColor: isDark ? '#333' : '#ddd',
      borderWidth: 1,
      textStyle: { color: isDark ? '#fff' : '#333' }
    }
  }

  export const PulseSparkline = defineComponent({
    name: 'PulseSparkline',
    props: {
      data: { type: Array as () => Array<{ time: string; value: number | null }>, required: true },
      max: { type: Number, default: null },
      color: { type: String, default: '' }
    },
    setup(props) {
      const chartRef = ref<HTMLElement>()
      let chart: echarts.ECharts | null = null
      const settingStore = useSettingStore()
      const { isDark } = storeToRefs(settingStore)

      let themeStop: (() => void) | null = null

      const resolveColor = (): string => {
        if (props.color) return resolveHex(props.color)
        return themeColor()
      }

      const buildOptions = (): EChartsOption => {
        const labels = props.data.map((p) => p.time)
        const values = props.data.map((p) => p.value ?? 0)
        const color = resolveColor()

        return {
          animation: false,
          grid: { top: 2, right: 2, bottom: 2, left: 2 },
          xAxis: { type: 'category', show: false, data: labels, boundaryGap: false },
          yAxis: { type: 'value', show: false, min: 0, max: props.max ?? undefined },
          tooltip: {
            ...tooltipStyle(isDark.value),
            formatter: (params: any) => {
              const p = params[0]
              return `${p.axisValue}<br/>${p.value}${props.max === 100 ? '%' : ''}`
            }
          },
          series: [
            {
              type: 'line',
              data: values,
              smooth: true,
              symbol: 'none',
              lineStyle: { width: 2, color },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: hexToRgba(color, 0.2).rgba },
                  { offset: 1, color: hexToRgba(color, 0.02).rgba }
                ])
              }
            }
          ]
        }
      }

      const render = () => {
        if (!chartRef.value) return
        if (!chart) {
          chart = echarts.init(chartRef.value)
        }
        chart.setOption(buildOptions(), true)
      }

      onMounted(() => {
        nextTick(render)
      })

      watch(() => props.data, render, { deep: true })

      themeStop = watch(isDark, () => {
        if (chart) chart.setOption(buildOptions(), true)
      })

      onBeforeUnmount(() => {
        themeStop?.()
        chart?.dispose()
        chart = null
      })

      return () => h('div', { ref: chartRef, class: 'w-full h-full' })
    }
  })

  /**
   * PulseMultiLine - 多折线图（用于队列吞吐）
   */
  export const PulseMultiLine = defineComponent({
    name: 'PulseMultiLine',
    props: {
      series: {
        type: Array as () => Array<{ name: string; data: number[]; color: string }>,
        required: true
      },
      labels: { type: Array as () => string[], required: true }
    },
    setup(props) {
      const chartRef = ref<HTMLElement>()
      let chart: echarts.ECharts | null = null
      const settingStore = useSettingStore()
      const { isDark } = storeToRefs(settingStore)

      let themeStop: (() => void) | null = null

      const buildOptions = (): EChartsOption => {
        const allValues = props.series.flatMap((s) => s.data)
        const maxVal = allValues.length ? Math.max(...allValues) : 0

        return {
          animation: false,
          grid: { top: 2, right: 2, bottom: 2, left: 2 },
          xAxis: { type: 'category', show: false, data: props.labels, boundaryGap: false },
          yAxis: { type: 'value', show: false, min: 0, max: maxVal || undefined },
          tooltip: {
            ...tooltipStyle(isDark.value),
            formatter: (params: any) => {
              let html = ''
              params.forEach((p: any) => {
                html += `${p.seriesName}: ${p.value}<br/>`
              })
              return html
            }
          },
          series: props.series.map((s) => {
            const hex = resolveHex(s.color)
            return {
              name: s.name,
              type: 'line' as const,
              data: s.data,
              smooth: true,
              symbol: 'none',
              lineStyle: { width: 2, color: hex },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: hexToRgba(hex, 0.15).rgba },
                  { offset: 1, color: hexToRgba(hex, 0.01).rgba }
                ])
              }
            }
          })
        }
      }

      const render = () => {
        if (!chartRef.value) return
        if (!chart) {
          chart = echarts.init(chartRef.value)
        }
        chart.setOption(buildOptions(), true)
      }

      onMounted(() => {
        nextTick(render)
      })

      watch(() => [props.series, props.labels], render, { deep: true })

      themeStop = watch(isDark, () => {
        if (chart) chart.setOption(buildOptions(), true)
      })

      onBeforeUnmount(() => {
        themeStop?.()
        chart?.dispose()
        chart = null
      })

      return () => h('div', { ref: chartRef, class: 'w-full h-full' })
    }
  })
</script>

<style scoped>
  .pulse-monitor {
    padding: 4px;
  }

  .legend-dot {
    display: inline-block;
    width: 12px;
    height: 2px;
    border-radius: 1px;
  }
</style>
