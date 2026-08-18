<template>
  <div class="horizon-monitor">
    <!-- 顶部状态栏 -->
    <div class="art-card p-4 mb-4 flex-cb">
      <div class="flex-c gap-3">
        <ArtSvgIcon icon="ri:flow-chart" class="text-lg text-theme" />
        <h3 class="text-base font-medium text-g-900">队列监控</h3>
        <span class="status-badge" :class="'status-' + (stats?.status || 'inactive')">
          {{ statusLabel(stats?.status || 'inactive') }}
        </span>
        <span class="text-xs text-g-400">最近刷新：{{ lastRefresh }}</span>
      </div>
      <ElButton :icon="Refresh" :loading="loading" size="small" circle @click="refreshCore" />
    </div>

    <!-- 主体：侧边栏 + 内容区 -->
    <div class="flex gap-4">
      <!-- 侧边栏 -->
      <aside class="horizon-sidebar art-card p-3 shrink-0">
        <nav class="space-y-0.5">
          <a
            v-for="item in navItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: activeView === item.key }"
            @click="switchView(item.key)"
          >
            <ArtSvgIcon :icon="item.icon" class="nav-icon" />
            <span>{{ item.label }}</span>
          </a>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 min-w-0">
        <!-- ===== Dashboard ===== -->
        <template v-if="activeView === 'dashboard'">
          <div v-loading="loading" class="min-h-[400px]">
            <!-- Overview 卡片 -->
            <div class="art-card overflow-hidden mb-4">
              <div class="card-header">
                <h4>Overview</h4>
              </div>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--default-border)]">
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">每分钟处理</div>
                  <div class="text-xl font-bold text-g-900 mt-2 tabular-nums">{{
                    stats?.jobsPerMinute ?? 0
                  }}</div>
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">最近任务</div>
                  <div class="text-xl font-bold text-g-900 mt-2 tabular-nums">{{
                    stats?.recentJobs ?? 0
                  }}</div>
                  <div class="text-xs text-g-400 mt-0.5"
                    >近 {{ stats?.periods?.recentJobs ?? 0 }} 分钟</div
                  >
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">失败任务</div>
                  <div class="text-xl font-bold text-g-900 mt-2 tabular-nums">{{
                    stats?.failedJobs ?? 0
                  }}</div>
                  <div class="text-xs text-g-400 mt-0.5"
                    >近 {{ stats?.periods?.failedJobs ?? 0 }} 分钟</div
                  >
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">状态</div>
                  <div class="flex-c gap-2 mt-2">
                    <span
                      class="status-dot"
                      :class="'status-' + (stats?.status || 'inactive')"
                    ></span>
                    <span class="text-base font-medium text-g-800">{{
                      statusLabel(stats?.status || 'inactive')
                    }}</span>
                    <span
                      v-if="stats?.status === 'running' && stats.pausedMasters > 0"
                      class="text-xs text-g-400"
                    >
                      ({{ stats.pausedMasters }} 已暂停)
                    </span>
                  </div>
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">总进程数</div>
                  <div class="text-xl font-bold text-g-900 mt-2 tabular-nums">{{
                    stats?.processes ?? 0
                  }}</div>
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">最大等待时间</div>
                  <div class="text-base font-medium text-g-800 mt-2">{{ maxWaitTime }}</div>
                  <div v-if="maxWaitQueue" class="text-xs text-g-400 mt-0.5">{{
                    maxWaitQueue
                  }}</div>
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">最长运行时</div>
                  <div class="text-base font-medium text-g-800 mt-2">{{
                    stats?.queueWithMaxRuntime || '—'
                  }}</div>
                </div>
                <div class="p-4 bg-[var(--art-bg-color)]">
                  <div class="text-xs text-g-500 font-bold">最大吞吐量</div>
                  <div class="text-base font-medium text-g-800 mt-2">{{
                    stats?.queueWithMaxThroughput || '—'
                  }}</div>
                </div>
              </div>
            </div>

            <!-- Current Workload -->
            <div v-if="workload.length" class="art-card overflow-hidden mb-4">
              <div class="card-header">
                <h4>Current Workload</h4>
              </div>
              <div class="workload-table">
                <div class="workload-head">
                  <div>队列</div>
                  <div class="text-right">任务数</div>
                  <div class="text-right">进程数</div>
                  <div class="text-right">等待</div>
                </div>
                <div v-for="item in workload" :key="item.name + item.queue" class="workload-row">
                  <div class="font-medium text-g-800">{{ item.name.replace(/,/g, ', ') }}</div>
                  <div class="text-right text-g-600 tabular-nums">{{ item.length ?? 0 }}</div>
                  <div class="text-right text-g-600 tabular-nums">{{ item.processes ?? 0 }}</div>
                  <div class="text-right text-g-600 tabular-nums">{{ humanTime(item.wait) }}</div>
                </div>
              </div>
            </div>

            <!-- Worker Cards -->
            <div v-for="worker in masters" :key="worker.name" class="art-card overflow-hidden mb-4">
              <div class="card-header flex-cb">
                <h4>{{ worker.name }}</h4>
                <span class="status-badge" :class="'status-' + worker.status">{{
                  statusLabel(worker.status)
                }}</span>
              </div>
              <div class="workload-table">
                <div class="workload-head">
                  <div>Supervisor</div>
                  <div>队列</div>
                  <div class="text-right">进程数</div>
                  <div class="text-right">平衡策略</div>
                </div>
                <div
                  v-for="supervisor in worker.supervisors"
                  :key="supervisor.name"
                  class="workload-row"
                >
                  <div class="flex-c gap-1.5">
                    <span
                      v-if="supervisor.status === 'paused'"
                      class="status-dot status-paused"
                    ></span>
                    <span
                      v-else-if="supervisor.status === 'inactive'"
                      class="status-dot status-inactive"
                    ></span>
                    <span class="text-g-800">{{
                      supervisorName(supervisor.name, worker.name)
                    }}</span>
                  </div>
                  <div class="text-g-600 text-sm">{{
                    supervisor.options?.queue?.replace(/,/g, ', ') || '—'
                  }}</div>
                  <div class="text-right text-g-600 tabular-nums">{{
                    countProcesses(supervisor.processes)
                  }}</div>
                  <div class="text-right text-g-600">{{
                    supervisor.options?.balance
                      ? capitalize(supervisor.options.balance)
                      : 'Disabled'
                  }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Monitoring ===== -->
        <template v-else-if="activeView === 'monitoring'">
          <div class="art-card p-4">
            <div class="flex-cb mb-4">
              <h4 class="text-base font-medium text-g-900">标签监控</h4>
              <ElInput
                v-model="newTag"
                placeholder="输入标签名称"
                size="small"
                style="width: 200px"
                @keyup.enter="addTag"
              >
                <template #append>
                  <ElButton :icon="Plus" @click="addTag" />
                </template>
              </ElInput>
            </div>
            <div v-loading="tagsLoading" class="min-h-[200px]">
              <ElEmpty v-if="!monitoringTags.length" description="暂无监控标签" :image-size="80" />
              <div v-else class="space-y-2">
                <div
                  v-for="tag in monitoringTags"
                  :key="tag.tag"
                  class="flex-cb p-3 rounded-custom-xs hover:bg-hover-color tad-200"
                  style="border-bottom: 1px solid var(--default-border)"
                >
                  <ElTag type="info" effect="plain">{{ tag.tag }}</ElTag>
                  <div class="flex-c gap-3">
                    <span class="text-sm text-g-700 tabular-nums">{{ tag.count }} 个任务</span>
                    <ElButton
                      type="danger"
                      size="small"
                      text
                      :icon="Delete"
                      @click="removeTag(tag.tag)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Metrics: Jobs ===== -->
        <template v-else-if="activeView === 'metrics-jobs'">
          <div v-loading="jobMetricsLoading" class="min-h-[200px]">
            <ElEmpty v-if="!jobMetricsList.length" description="暂无任务指标" :image-size="80" />
            <div v-else class="space-y-4">
              <div v-for="jobId in jobMetricsList" :key="jobId" class="art-card p-4">
                <div class="text-sm font-medium text-g-800 mb-2">{{ simplifyName(jobId) }}</div>
                <MetricsChart
                  :snapshots="jobMetricsDetail[jobId] || []"
                  :title="jobId"
                  type="job"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Metrics: Queues ===== -->
        <template v-else-if="activeView === 'metrics-queues'">
          <div v-loading="queueMetricsLoading" class="min-h-[200px]">
            <ElEmpty v-if="!queueMetricsList.length" description="暂无队列指标" :image-size="80" />
            <div v-else class="space-y-4">
              <div v-for="queueId in queueMetricsList" :key="queueId" class="art-card p-4">
                <div class="text-sm font-medium text-g-800 mb-2">{{ queueId }}</div>
                <MetricsChart
                  :snapshots="queueMetricsDetail[queueId] || []"
                  :title="queueId"
                  type="queue"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Batches ===== -->
        <template v-else-if="activeView === 'batches'">
          <div v-loading="batchesLoading" class="art-card p-4 min-h-[200px]">
            <ElEmpty v-if="!batches.length" description="暂无批处理数据" :image-size="80" />
            <div v-else class="space-y-2">
              <div
                v-for="batch in batches"
                :key="batch.id"
                class="batch-row"
                @click="showBatchDetail(batch.id)"
              >
                <div class="min-w-0">
                  <div class="text-sm font-medium text-g-800 truncate">{{ batch.name }}</div>
                  <div class="text-xs text-g-400 font-mono truncate">{{ batch.id }}</div>
                </div>
                <div class="text-sm text-g-700 tabular-nums text-right">
                  <span class="text-xs text-g-400">总数</span> {{ batch.total_jobs }}
                </div>
                <div class="text-sm text-g-700 tabular-nums text-right">
                  <span class="text-xs text-g-400">已处理</span> {{ batch.processed_jobs }}
                </div>
                <div class="text-sm tabular-nums text-right">
                  <span class="text-xs text-g-400">失败</span>
                  <span :class="batch.failed_jobs > 0 ? 'text-danger font-bold' : 'text-g-700'">{{
                    batch.failed_jobs
                  }}</span>
                </div>
                <div class="text-right">
                  <ElTag size="small" :type="batchStatusType(batch)" effect="light">{{
                    batchStatusLabel(batch)
                  }}</ElTag>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Failed / Pending / Completed / Silenced Jobs ===== -->
        <template v-else>
          <div class="art-card p-4">
            <JobList
              :type="activeView as any"
              :title="currentNavLabel"
              @show-detail="showJobDetail"
              @retry="handleRetry"
            />
          </div>
        </template>
      </main>
    </div>

    <!-- 任务详情抽屉 -->
    <ElDrawer v-model="jobDrawerVisible" title="任务详情" size="60%" :destroy-on-close="true">
      <div v-loading="jobDetailLoading" class="p-4 space-y-4">
        <template v-if="jobDetail">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-g-500 mb-1">任务名称</div>
              <div class="text-sm text-g-800 font-mono break-all">{{ jobDetail.name }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">任务 ID</div>
              <div class="text-sm text-g-700 font-mono break-all">{{ jobDetail.id }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">队列</div>
              <div class="text-sm text-g-700">{{ jobDetail.queue }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">状态</div>
              <ElTag :type="jobStatusTagType(jobDetail.status)" size="small">{{
                jobDetail.status
              }}</ElTag>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">连接</div>
              <div class="text-sm text-g-700">{{ jobDetail.connection }}</div>
            </div>
            <div v-if="jobDetail.failed_at || jobDetail.completed_at">
              <div class="text-xs text-g-500 mb-1">时间</div>
              <div class="text-sm text-g-700">{{
                jobDetail.failed_at || jobDetail.completed_at
              }}</div>
            </div>
          </div>

          <div v-if="jobDetail.exception">
            <div class="text-xs text-g-500 mb-1">异常信息</div>
            <pre
              class="art-card p-3 text-xs text-danger font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap"
              >{{ jobDetail.exception }}</pre>
          </div>

          <div v-if="jobDetail.payload">
            <div class="text-xs text-g-500 mb-1">Payload</div>
            <pre
              class="art-card p-3 text-xs text-g-700 font-mono overflow-x-auto max-h-[200px] overflow-y-auto"
              >{{ JSON.stringify(jobDetail.payload, null, 2) }}</pre>
          </div>

          <div v-if="jobDetail.retried_by?.length">
            <div class="text-xs text-g-500 mb-1">重试记录</div>
            <div class="space-y-1">
              <div
                v-for="(retry, idx) in jobDetail.retried_by"
                :key="idx"
                class="flex-c gap-2 p-2 rounded-custom-xs bg-(--art-gray-100)"
              >
                <span class="text-xs text-g-600 font-mono">{{ retry.retried_at }}</span>
              </div>
            </div>
          </div>

          <div v-if="jobDetail.status === 'failed'">
            <ElButton type="primary" @click="retryFromDrawer">重试此任务</ElButton>
          </div>
        </template>
      </div>
    </ElDrawer>

    <!-- 批处理详情抽屉 -->
    <ElDrawer v-model="batchDrawerVisible" title="批处理详情" size="60%" :destroy-on-close="true">
      <div v-loading="batchDetailLoading" class="p-4 space-y-4">
        <template v-if="batchDetail?.batch">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-g-500 mb-1">名称</div>
              <div class="text-sm text-g-800">{{ batchDetail.batch.name }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">ID</div>
              <div class="text-sm text-g-700 font-mono break-all">{{ batchDetail.batch.id }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">任务总数</div>
              <div class="text-sm text-g-700 tabular-nums">{{ batchDetail.batch.total_jobs }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">已处理</div>
              <div class="text-sm text-g-700 tabular-nums">{{
                batchDetail.batch.processed_jobs
              }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">失败</div>
              <div
                class="text-sm tabular-nums"
                :class="batchDetail.batch.failed_jobs > 0 ? 'text-danger font-bold' : 'text-g-700'"
                >{{ batchDetail.batch.failed_jobs }}</div
              >
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">进度</div>
              <ElProgress
                :percentage="Math.round(batchDetail.batch.progress)"
                :status="batchDetail.batch.failed_jobs > 0 ? 'warning' : 'success'"
              />
            </div>
          </div>

          <div v-if="batchDetail.failedJobs?.length">
            <div class="flex-cb mb-2">
              <span class="text-xs text-g-500"
                >失败任务（{{ batchDetail.failedJobs.length }}）</span
              >
              <ElButton type="primary" size="small" @click="retryBatch(batchDetail.batch.id)"
                >重试全部失败任务</ElButton
              >
            </div>
            <div class="space-y-1.5">
              <div
                v-for="job in batchDetail.failedJobs"
                :key="job.id"
                class="flex-c gap-2 p-2 rounded-custom-xs bg-(--art-gray-100) cursor-pointer"
                @click="
                  showJobDetail(String(job.id))
                  batchDrawerVisible = false
                "
              >
                <ElTag type="danger" size="small">失败</ElTag>
                <span class="text-xs text-g-700 truncate font-mono">{{ job.name }}</span>
                <span class="text-xs text-g-400 ml-auto">{{ job.id }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchHorizonStats,
    fetchHorizonWorkload,
    fetchHorizonMasters,
    fetchHorizonMonitoringTags,
    monitorHorizonTag,
    stopMonitoringHorizonTag,
    fetchHorizonJobMetrics,
    fetchHorizonJobMetricsDetail,
    fetchHorizonQueueMetrics,
    fetchHorizonQueueMetricsDetail,
    fetchHorizonBatches,
    fetchHorizonBatchDetail,
    retryHorizonBatch,
    fetchHorizonJob,
    fetchHorizonFailedJobDetail,
    retryHorizonJob,
    type HorizonStats,
    type HorizonWorkload,
    type HorizonMaster,
    type HorizonMonitoringTag,
    type HorizonMetricSnapshot,
    type HorizonBatch,
    type HorizonBatchDetail,
    type HorizonJob
  } from '@/api/queue'
  import { Refresh, Plus, Delete } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import MetricsChart from './components/MetricsChart.vue'
  import JobList from './components/JobList.vue'

  defineOptions({ name: 'HorizonMonitor' })

  // ===== 导航 =====
  interface NavItem {
    key: string
    label: string
    icon: string
  }

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'ri:dashboard-line' },
    { key: 'monitoring', label: 'Monitoring', icon: 'ri:eye-line' },
    { key: 'metrics-jobs', label: 'Job Metrics', icon: 'ri:bar-chart-line' },
    { key: 'metrics-queues', label: 'Queue Metrics', icon: 'ri:line-chart-line' },
    { key: 'batches', label: 'Batches', icon: 'ri:stack-line' },
    { key: 'pending', label: 'Pending Jobs', icon: 'ri:pause-circle-line' },
    { key: 'completed', label: 'Completed Jobs', icon: 'ri:checkbox-circle-line' },
    { key: 'silenced', label: 'Silenced Jobs', icon: 'ri:volume-mute-line' },
    { key: 'failed', label: 'Failed Jobs', icon: 'ri:error-warning-line' }
  ]

  const activeView = ref('dashboard')

  const currentNavLabel = computed(
    () => navItems.find((n) => n.key === activeView.value)?.label || ''
  )

  function switchView(key: string) {
    activeView.value = key
    if (key === 'metrics-jobs' && !jobMetricsList.value.length) fetchJobMetrics()
    if (key === 'metrics-queues' && !queueMetricsList.value.length) fetchQueueMetrics()
    if (key === 'batches' && !batches.value.length) fetchBatches()
    if (key === 'monitoring' && !monitoringTags.value.length) fetchTags()
  }

  // ===== 核心数据（高频轮询） =====
  const loading = ref(false)
  const stats = ref<HorizonStats>()
  const workload = ref<HorizonWorkload[]>([])
  const masters = ref<HorizonMaster[]>([])
  const lastRefresh = ref('—')

  // ===== 标签监控 =====
  const monitoringTags = ref<HorizonMonitoringTag[]>([])
  const tagsLoading = ref(false)
  const newTag = ref('')

  // ===== 指标 =====
  const jobMetricsList = ref<string[]>([])
  const jobMetricsDetail = ref<Record<string, HorizonMetricSnapshot[]>>({})
  const jobMetricsLoading = ref(false)
  const queueMetricsList = ref<string[]>([])
  const queueMetricsDetail = ref<Record<string, HorizonMetricSnapshot[]>>({})
  const queueMetricsLoading = ref(false)

  // ===== 批处理 =====
  const batches = ref<HorizonBatch[]>([])
  const batchesLoading = ref(false)
  const batchDetail = ref<HorizonBatchDetail>()
  const batchDetailLoading = ref(false)
  const batchDrawerVisible = ref(false)

  // ===== 任务详情 =====
  const jobDetail = ref<HorizonJob>()
  const jobDetailLoading = ref(false)
  const jobDrawerVisible = ref(false)

  // ===== 计算属性 =====

  const maxWaitTime = computed(() => {
    const wait = stats.value?.wait?.[0]
    return wait ? humanTime(wait.wait) : '—'
  })

  const maxWaitQueue = computed(() => {
    const wait = stats.value?.wait?.[0]
    if (!wait) return ''
    return wait.name.split(':')[1] || wait.name
  })

  // ===== 工具函数 =====

  function statusLabel(status: string): string {
    switch (status) {
      case 'running':
        return 'Active'
      case 'paused':
        return 'Paused'
      case 'inactive':
        return 'Inactive'
      default:
        return status
    }
  }

  function jobStatusTagType(status: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' {
    switch (status) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'reserved':
        return 'primary'
      case 'silenced':
        return 'info'
      default:
        return 'info'
    }
  }

  function simplifyName(name: string): string {
    if (!name) return '—'
    const parts = name.split('\\')
    return parts[parts.length - 1]
  }

  function humanTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—'
    if (seconds < 60) return `${seconds} 秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
    return `${Math.floor(seconds / 3600)} 小时`
  }

  function supervisorName(supervisor: string, master: string): string {
    return supervisor.replace(master + ':', '')
  }

  function countProcesses(processes: any[]): number {
    if (!processes) return 0
    return processes.length
  }

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function batchStatusType(batch: HorizonBatch): 'success' | 'warning' | 'info' | 'danger' {
    if (batch.cancelled_at) return 'info'
    if (batch.failed_jobs > 0) return 'danger'
    if (batch.finished_at) return 'success'
    return 'warning'
  }

  function batchStatusLabel(batch: HorizonBatch): string {
    if (batch.cancelled_at) return '已取消'
    if (batch.failed_jobs > 0) return '有失败'
    if (batch.finished_at) return '已完成'
    return '处理中'
  }

  function updateTime(): void {
    const now = new Date()
    lastRefresh.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  }

  // ===== API 请求 =====

  async function fetchStats() {
    try {
      stats.value = await fetchHorizonStats()
      updateTime()
    } catch {
      // 静默处理
    }
  }

  async function fetchWorkload() {
    try {
      workload.value = await fetchHorizonWorkload()
    } catch {
      // 静默
    }
  }

  async function fetchMasters() {
    try {
      masters.value = await fetchHorizonMasters()
    } catch {
      // 静默
    }
  }

  async function fetchTags() {
    tagsLoading.value = true
    try {
      monitoringTags.value = await fetchHorizonMonitoringTags()
    } finally {
      tagsLoading.value = false
    }
  }

  async function addTag() {
    if (!newTag.value.trim()) return
    try {
      await monitorHorizonTag(newTag.value.trim())
      newTag.value = ''
      ElMessage.success('已添加监控标签')
      fetchTags()
    } catch {
      ElMessage.error('添加失败')
    }
  }

  async function removeTag(tag: string) {
    try {
      await stopMonitoringHorizonTag(tag)
      ElMessage.success('已移除监控标签')
      fetchTags()
    } catch {
      ElMessage.error('移除失败')
    }
  }

  async function fetchJobMetrics() {
    jobMetricsLoading.value = true
    try {
      const list = await fetchHorizonJobMetrics()
      jobMetricsList.value = list
      const results = await Promise.all(
        list.map(async (id) => ({ id, snapshots: await fetchHorizonJobMetricsDetail(id) }))
      )
      const detailMap: Record<string, HorizonMetricSnapshot[]> = {}
      results.forEach(({ id, snapshots }) => {
        detailMap[id] = snapshots
      })
      jobMetricsDetail.value = detailMap
    } finally {
      jobMetricsLoading.value = false
    }
  }

  async function fetchQueueMetrics() {
    queueMetricsLoading.value = true
    try {
      const list = await fetchHorizonQueueMetrics()
      queueMetricsList.value = list
      const results = await Promise.all(
        list.map(async (id) => ({ id, snapshots: await fetchHorizonQueueMetricsDetail(id) }))
      )
      const detailMap: Record<string, HorizonMetricSnapshot[]> = {}
      results.forEach(({ id, snapshots }) => {
        detailMap[id] = snapshots
      })
      queueMetricsDetail.value = detailMap
    } finally {
      queueMetricsLoading.value = false
    }
  }

  async function fetchBatches() {
    batchesLoading.value = true
    try {
      const res = await fetchHorizonBatches()
      batches.value = res.batches
    } finally {
      batchesLoading.value = false
    }
  }

  async function showBatchDetail(id: string) {
    batchDrawerVisible.value = true
    batchDetailLoading.value = true
    try {
      batchDetail.value = await fetchHorizonBatchDetail(id)
    } finally {
      batchDetailLoading.value = false
    }
  }

  async function retryBatch(id: string) {
    try {
      await retryHorizonBatch(id)
      ElMessage.success('已提交重试')
      showBatchDetail(id)
    } catch {
      ElMessage.error('重试失败')
    }
  }

  async function showJobDetail(id: string) {
    jobDrawerVisible.value = true
    jobDetailLoading.value = true
    try {
      try {
        jobDetail.value = await fetchHorizonJob(id)
      } catch {
        jobDetail.value = await fetchHorizonFailedJobDetail(id)
      }
    } finally {
      jobDetailLoading.value = false
    }
  }

  async function handleRetry(id: string) {
    try {
      await retryHorizonJob(id)
      ElMessage.success('已提交重试')
    } catch {
      ElMessage.error('重试失败')
    }
  }

  async function retryFromDrawer() {
    if (!jobDetail.value) return
    await handleRetry(String(jobDetail.value.id))
    jobDrawerVisible.value = false
  }

  function refreshCore() {
    loading.value = true
    Promise.all([fetchStats(), fetchWorkload(), fetchMasters()]).finally(() => {
      loading.value = false
    })
  }

  // ===== 轮询 =====
  const pollTimers: ReturnType<typeof setInterval>[] = []

  function startPoll(fetchFn: () => Promise<void>, interval: number): void {
    fetchFn()
    pollTimers.push(setInterval(fetchFn, interval))
  }

  onMounted(() => {
    startPoll(fetchStats, 5000)
    startPoll(fetchWorkload, 5000)
    startPoll(fetchMasters, 5000)
    startPoll(fetchTags, 10000)
  })

  onBeforeUnmount(() => {
    pollTimers.forEach(clearInterval)
    pollTimers.length = 0
  })
</script>

<style scoped>
  @reference '@/assets/styles/core/tailwind.css';

  .horizon-monitor {
    @apply pb-4;
  }

  /* 侧边栏 */
  .horizon-sidebar {
    width: 180px;
  }

  .nav-item {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--color-g-600);
    cursor: pointer;
    border-radius: var(--custom-radius-xs);
    transition: all 0.15s;
  }

  .nav-item:hover {
    color: var(--color-g-800);
    background: var(--art-gray-100);
  }

  .nav-item.active {
    font-weight: 500;
    color: var(--el-color-primary);
    background: var(--color-primary-10, rgba(var(--el-color-primary-rgb), 0.1));
  }

  .nav-icon {
    flex-shrink: 0;
    font-size: 16px;
  }

  /* 卡片头部 */
  .card-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--default-border);
  }

  .card-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-g-800);
  }

  /* 工作负载表 */
  .workload-table {
    width: 100%;
  }

  .workload-head {
    display: grid;
    grid-template-columns: minmax(0, 2fr) 100px 100px 120px;
    gap: 8px;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-g-500);
    text-transform: uppercase;
    border-bottom: 1px solid var(--default-border);
  }

  .workload-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) 100px 100px 120px;
    gap: 8px;
    padding: 10px 16px;
    font-size: 13px;
    color: var(--color-g-700);
    border-bottom: 1px solid var(--default-border);
    transition: background 0.15s;
  }

  .workload-row:last-child {
    border-bottom: none;
  }

  .workload-row:hover {
    background: var(--art-gray-100);
  }

  /* 批处理行 */
  .batch-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) 100px 100px 100px 80px;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid var(--default-border);
    border-radius: var(--custom-radius-xs);
    transition: background 0.15s;
  }

  .batch-row:hover {
    background: var(--art-gray-100);
  }

  /* 状态徽章 */
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 4px;
  }

  .status-badge.status-running {
    color: var(--el-color-success);
    background: rgba(var(--el-color-success-rgb), 0.15);
  }

  .status-badge.status-paused {
    color: var(--el-color-warning);
    background: rgba(var(--el-color-warning-rgb), 0.15);
  }

  .status-badge.status-inactive {
    color: var(--el-color-danger);
    background: rgba(var(--el-color-danger-rgb), 0.15);
  }

  /* 状态指示点 */
  .status-dot {
    display: inline-block;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-dot.status-running {
    background: var(--el-color-success);
  }

  .status-dot.status-paused {
    background: var(--el-color-warning);
  }

  .status-dot.status-inactive {
    background: var(--el-color-danger);
  }

  /* 响应式 */
  @media (width <= 768px) {
    .horizon-sidebar {
      width: 100%;
      margin-bottom: 16px;
    }

    .horizon-monitor > .flex {
      flex-direction: column;
    }

    .workload-head,
    .workload-row {
      grid-template-columns: 1fr 60px 60px 60px;
    }

    .batch-row {
      grid-template-columns: 1fr 60px 60px 60px;
    }
  }
</style>
