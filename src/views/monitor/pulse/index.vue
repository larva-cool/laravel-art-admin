<template>
  <div class="pulse-monitor">
    <!-- 顶部工具栏：周期选择 + 刷新 -->
    <div class="flex items-center justify-between mb-4">
      <ElRadioGroup v-model="period" size="small" @change="fetchAll">
        <ElRadioButton value="1_hour">1 小时</ElRadioButton>
        <ElRadioButton value="6_hours">6 小时</ElRadioButton>
        <ElRadioButton value="24_hours">24 小时</ElRadioButton>
        <ElRadioButton value="7_days">7 天</ElRadioButton>
      </ElRadioGroup>
      <ElButton :icon="Refresh" :loading="loading" size="small" @click="fetchAll"> 刷新 </ElButton>
    </div>

    <!-- 服务器资源（全宽） -->
    <ElCard shadow="never" class="mb-4">
      <template #header>
        <div class="flex items-center gap-2">
          <ElIcon :size="18"><Monitor /></ElIcon>
          <span class="font-bold">服务器资源</span>
        </div>
      </template>
      <div v-loading="loading">
        <ElEmpty v-if="!servers.length" description="暂无服务器数据" :image-size="60" />
        <div v-else class="space-y-4">
          <div
            v-for="server in servers"
            :key="server.slug"
            class="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto_1fr_auto] gap-4 items-center"
          >
            <!-- 服务器名称 -->
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="w-2 h-2 rounded-full shrink-0"
                :class="server.recently_reported ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
              />
              <span class="font-bold truncate">{{ server.name }}</span>
            </div>
            <!-- CPU -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-g-500 w-10 shrink-0">CPU</span>
              <span class="text-lg font-bold tabular-nums w-12 shrink-0"
                >{{ server.cpu_current }}%</span
              >
              <div class="flex-1 h-8 min-w-0">
                <PulseSparkline :data="server.cpu" :max="100" color="#9333ea" />
              </div>
            </div>
            <!-- Memory -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-g-500 w-12 shrink-0">内存</span>
              <span class="text-lg font-bold tabular-nums whitespace-nowrap">
                {{ friendlySize(server.memory_current, 1) }}
              </span>
              <span class="text-sm text-g-500 whitespace-nowrap">
                / {{ friendlySize(server.memory_total, 1) }}
              </span>
            </div>
            <!-- Memory 图 + 存储 -->
            <div class="flex items-center gap-4">
              <div class="flex-1 h-8 min-w-0">
                <PulseSparkline :data="server.memory" :max="server.memory_total" color="#9333ea" />
              </div>
            </div>
            <!-- 存储 -->
            <div class="flex items-center gap-4">
              <div
                v-for="disk in server.storage"
                :key="disk.directory"
                class="flex items-center gap-2"
              >
                <div class="text-right whitespace-nowrap">
                  <span class="font-bold tabular-nums">{{ friendlySize(disk.used) }}</span>
                  <span class="text-sm text-g-500">/ {{ friendlySize(disk.total) }}</span>
                </div>
                <ElProgress
                  type="dashboard"
                  :percentage="diskPercentage(disk)"
                  :width="40"
                  :stroke-width="4"
                  :color="diskColor(diskPercentage(disk))"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElCard>

    <!-- 第二行：使用量 + 队列 + 缓存 -->
    <ElRow :gutter="16" class="mb-4">
      <!-- 用户使用量 -->
      <ElCol :xs="24" :md="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><TrendCharts /></ElIcon>
                <span class="font-bold">用户使用量</span>
              </div>
              <ElSelect v-model="usageType" size="small" style="width: 120px" @change="fetchUsage">
                <ElOption label="请求数" value="requests" />
                <ElOption label="慢请求" value="slow_requests" />
                <ElOption label="任务数" value="jobs" />
              </ElSelect>
            </div>
          </template>
          <div v-loading="usageLoading">
            <ElEmpty v-if="!usage.length" description="暂无数据" :image-size="60" />
            <div v-else class="space-y-2">
              <div
                v-for="(user, index) in usage"
                :key="user.key"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--el-fill-color-light)]"
              >
                <span class="text-g-500 text-sm w-5 text-center">{{ index + 1 }}</span>
                <ElAvatar :size="32" :src="user.avatar ?? undefined">
                  {{ user.name?.charAt(0) ?? '?' }}
                </ElAvatar>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ user.name ?? user.key }}</div>
                </div>
                <span class="text-lg font-bold tabular-nums">{{ formatNumber(user.count) }}</span>
              </div>
            </div>
          </div>
        </ElCard>
      </ElCol>

      <!-- 队列吞吐 -->
      <ElCol :xs="24" :md="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><List /></ElIcon>
                <span class="font-bold">队列吞吐</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-g-500">
                <span class="flex items-center gap-1"
                  ><i class="legend-dot bg-gray-400" />入队</span
                >
                <span class="flex items-center gap-1"
                  ><i class="legend-dot bg-purple-400" />处理中</span
                >
                <span class="flex items-center gap-1"
                  ><i class="legend-dot bg-purple-600" />已处理</span
                >
                <span class="flex items-center gap-1"
                  ><i class="legend-dot bg-yellow-500" />已重试</span
                >
                <span class="flex items-center gap-1"><i class="legend-dot bg-red-500" />失败</span>
              </div>
            </div>
          </template>
          <div v-loading="queuesLoading">
            <ElEmpty v-if="!queues.length" description="暂无队列数据" :image-size="60" />
            <div v-else class="space-y-3">
              <div v-for="queue in queues" :key="queue.key">
                <div class="text-sm font-bold mb-1">{{ queue.queue || queue.key }}</div>
                <div class="h-14">
                  <PulseMultiLine
                    :series="[
                      {
                        name: '入队',
                        data: extractValues(queue.queued),
                        color: 'rgba(107,114,128,0.5)'
                      },
                      {
                        name: '处理中',
                        data: extractValues(queue.processing),
                        color: 'rgba(147,51,234,0.5)'
                      },
                      { name: '已处理', data: extractValues(queue.processed), color: '#9333ea' },
                      { name: '已重试', data: extractValues(queue.released), color: '#eab308' },
                      { name: '失败', data: extractValues(queue.failed), color: '#e11d48' }
                    ]"
                    :labels="extractLabels(queue.queued)"
                  />
                </div>
              </div>
            </div>
          </div>
        </ElCard>
      </ElCol>

      <!-- 缓存命中率 -->
      <ElCol :xs="24" :md="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center gap-2">
              <ElIcon :size="18"><Promotion /></ElIcon>
              <span class="font-bold">缓存命中率</span>
            </div>
          </template>
          <div v-loading="cacheLoading">
            <ElEmpty
              v-if="cache.hits === 0 && cache.misses === 0"
              description="暂无数据"
              :image-size="60"
            />
            <div v-else>
              <div class="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div class="text-xl font-bold tabular-nums">{{ formatNumber(cache.hits) }}</div>
                  <div class="text-xs text-g-500">命中</div>
                </div>
                <div>
                  <div class="text-xl font-bold tabular-nums">{{ formatNumber(cache.misses) }}</div>
                  <div class="text-xs text-g-500">未命中</div>
                </div>
                <div>
                  <div class="text-xl font-bold tabular-nums">{{ cacheHitRate }}%</div>
                  <div class="text-xs text-g-500">命中率</div>
                </div>
              </div>
              <ElTable :data="cache.keys" size="small" max-height="300" stripe>
                <ElTableColumn prop="key" label="Key" min-width="200" show-overflow-tooltip />
                <ElTableColumn prop="hits" label="命中" width="80" align="right" />
                <ElTableColumn prop="misses" label="未命中" width="80" align="right" />
                <ElTableColumn label="命中率" width="80" align="right">
                  <template #default="{ row }"> {{ keyHitRate(row) }}% </template>
                </ElTableColumn>
              </ElTable>
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 慢查询（宽） + 异常 -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol :xs="24" :lg="16">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><Coin /></ElIcon>
                <span class="font-bold">慢查询</span>
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
          </template>
          <div v-loading="slowQueriesLoading">
            <ElEmpty v-if="!slowQueries.length" description="暂无慢查询" :image-size="60" />
            <template v-else>
              <div class="space-y-2">
                <div
                  v-for="query in slowQueries.slice(0, 5)"
                  :key="`${query.sql}-${query.location}`"
                  class="rounded-md bg-gray-700 dark:bg-gray-800 p-3"
                >
                  <code class="text-xs text-gray-100 break-all">{{ query.sql }}</code>
                  <div class="flex items-center justify-between mt-2">
                    <span v-if="query.location" class="text-xs text-gray-400">{{
                      query.location
                    }}</span>
                    <div class="flex items-center gap-4 ml-auto">
                      <span class="text-xs text-gray-300"
                        >次数: <strong>{{ query.count }}</strong></span
                      >
                      <span class="text-xs text-gray-300"
                        >最慢: <strong>{{ query.slowest || '<1' }}</strong> ms</span
                      >
                    </div>
                  </div>
                </div>
              </div>
              <ElCollapse v-if="slowQueries.length > 5" class="mt-2">
                <ElCollapseItem :name="'more'" :title="`展开剩余 ${slowQueries.length - 5} 条`">
                  <div class="space-y-2">
                    <div
                      v-for="query in slowQueries.slice(5)"
                      :key="`${query.sql}-${query.location}`"
                      class="rounded-md bg-gray-700 dark:bg-gray-800 p-3"
                    >
                      <code class="text-xs text-gray-100 break-all">{{ query.sql }}</code>
                      <div class="flex items-center justify-between mt-2">
                        <span v-if="query.location" class="text-xs text-gray-400">{{
                          query.location
                        }}</span>
                        <div class="flex items-center gap-4 ml-auto">
                          <span class="text-xs text-gray-300"
                            >次数: <strong>{{ query.count }}</strong></span
                          >
                          <span class="text-xs text-gray-300"
                            >最慢: <strong>{{ query.slowest || '<1' }}</strong> ms</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </ElCollapseItem>
              </ElCollapse>
            </template>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :lg="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><WarnTriangleFilled /></ElIcon>
                <span class="font-bold">异常统计</span>
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
          </template>
          <div v-loading="exceptionsLoading">
            <ElEmpty v-if="!exceptions.length" description="暂无异常" :image-size="60" />
            <template v-else>
              <div class="space-y-2">
                <div
                  v-for="item in exceptions.slice(0, 5)"
                  :key="`${item.class}-${item.location}`"
                  class="p-2 rounded-lg hover:bg-[var(--el-fill-color-light)]"
                >
                  <code class="text-xs break-all" :title="item.class">{{ item.class }}</code>
                  <div class="flex items-center justify-between mt-1">
                    <span
                      v-if="item.location"
                      class="text-xs text-g-500 truncate"
                      :title="item.location"
                    >
                      {{ item.location }}
                    </span>
                    <div class="flex items-center gap-4 ml-auto shrink-0">
                      <span class="text-xs text-g-500">{{ formatTime(item.latest) }}</span>
                      <span class="text-sm font-bold tabular-nums">{{ item.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ElCollapse v-if="exceptions.length > 5" class="mt-2">
                <ElCollapseItem :name="'more'" :title="`展开剩余 ${exceptions.length - 5} 条`">
                  <div class="space-y-2">
                    <div
                      v-for="item in exceptions.slice(5)"
                      :key="`${item.class}-${item.location}`"
                      class="p-2 rounded-lg hover:bg-[var(--el-fill-color-light)]"
                    >
                      <code class="text-xs break-all" :title="item.class">{{ item.class }}</code>
                      <div class="flex items-center justify-between mt-1">
                        <span
                          v-if="item.location"
                          class="text-xs text-g-500 truncate"
                          :title="item.location"
                        >
                          {{ item.location }}
                        </span>
                        <div class="flex items-center gap-4 ml-auto shrink-0">
                          <span class="text-xs text-g-500">{{ formatTime(item.latest) }}</span>
                          <span class="text-sm font-bold tabular-nums">{{ item.count }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ElCollapseItem>
              </ElCollapse>
            </template>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 慢请求 + 慢任务 + 慢外部请求 -->
    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><Timer /></ElIcon>
                <span class="font-bold">慢请求</span>
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
          </template>
          <div v-loading="slowRequestsLoading">
            <ElEmpty v-if="!slowRequests.length" description="暂无慢请求" :image-size="60" />
            <ElTable v-else :data="slowRequests" size="small" stripe>
              <ElTableColumn label="路由" min-width="200">
                <template #default="{ row }">
                  <code class="text-xs">{{ row.method }}</code>
                  <span class="text-xs ml-1 break-all">{{ row.uri }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="count" label="次数" width="60" align="right" />
              <ElTableColumn label="最慢" width="80" align="right">
                <template #default="{ row }">{{ row.slowest }} ms</template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :lg="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><Briefcase /></ElIcon>
                <span class="font-bold">慢任务</span>
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
          </template>
          <div v-loading="slowJobsLoading">
            <ElEmpty v-if="!slowJobs.length" description="暂无慢任务" :image-size="60" />
            <ElTable v-else :data="slowJobs" size="small" stripe>
              <ElTableColumn prop="job" label="任务" min-width="200" show-overflow-tooltip />
              <ElTableColumn prop="count" label="次数" width="60" align="right" />
              <ElTableColumn label="最慢" width="80" align="right">
                <template #default="{ row }">{{ row.slowest }} ms</template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :lg="8">
        <ElCard shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElIcon :size="18"><Link /></ElIcon>
                <span class="font-bold">慢外部请求</span>
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
          </template>
          <div v-loading="slowOutgoingLoading">
            <ElEmpty
              v-if="!slowOutgoingRequests.length"
              description="暂无慢外部请求"
              :image-size="60"
            />
            <ElTable v-else :data="slowOutgoingRequests" size="small" stripe>
              <ElTableColumn label="地址" min-width="200">
                <template #default="{ row }">
                  <code class="text-xs">{{ row.method }}</code>
                  <span class="text-xs ml-1 break-all">{{ row.uri }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="count" label="次数" width="60" align="right" />
              <ElTableColumn label="最慢" width="80" align="right">
                <template #default="{ row }">{{ row.slowest }} ms</template>
              </ElTableColumn>
            </ElTable>
          </div>
        </ElCard>
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
  import {
    Briefcase,
    Coin,
    Link,
    List,
    Monitor,
    Promotion,
    Refresh,
    Timer,
    TrendCharts,
    WarnTriangleFilled
  } from '@element-plus/icons-vue'

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

  /** 拉取全部数据 */
  async function fetchAll() {
    loading.value = isFirstLoad.value

    await Promise.all([
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

    if (isFirstLoad.value) {
      isFirstLoad.value = false
      loading.value = false
    }
  }

  // ===== 生命周期 =====

  let pollTimer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    fetchAll()
    // 5 秒轮询，与 Pulse 官方面板一致
    pollTimer = setInterval(fetchAll, 5000)
  })

  onBeforeUnmount(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  })
</script>

<script lang="ts">
  /**
   * PulseSparkline - 迷你折线图（用于 CPU / 内存趋势）
   */
  import { echarts, type EChartsOption } from '@/plugins/echarts'
  import { useSettingStore } from '@/store/modules/setting'
  import { storeToRefs } from 'pinia'
  import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

  export const PulseSparkline = defineComponent({
    name: 'PulseSparkline',
    props: {
      data: { type: Array as () => Array<{ time: string; value: number | null }>, required: true },
      max: { type: Number, default: null },
      color: { type: String, default: '#9333ea' }
    },
    setup(props) {
      const chartRef = ref<HTMLElement>()
      let chart: echarts.ECharts | null = null
      const settingStore = useSettingStore()
      const { isDark } = storeToRefs(settingStore)

      let themeStop: (() => void) | null = null

      const buildOptions = (): EChartsOption => {
        const labels = props.data.map((p) => p.time)
        const values = props.data.map((p) => p.value ?? 0)

        return {
          animation: false,
          grid: { top: 2, right: 2, bottom: 2, left: 2 },
          xAxis: { type: 'category', show: false, data: labels, boundaryGap: false },
          yAxis: { type: 'value', show: false, min: 0, max: props.max ?? undefined },
          tooltip: {
            trigger: 'axis',
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
              lineStyle: { width: 2, color: props.color },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: props.color + '30' },
                  { offset: 1, color: props.color + '02' }
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
            trigger: 'axis',
            formatter: (params: any) => {
              let html = ''
              params.forEach((p: any) => {
                html += `${p.seriesName}: ${p.value}<br/>`
              })
              return html
            }
          },
          series: props.series.map((s) => ({
            name: s.name,
            type: 'line',
            data: s.data,
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2, color: s.color }
          }))
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

  :deep(.el-card__header) {
    padding: 10px 16px;
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
</style>
