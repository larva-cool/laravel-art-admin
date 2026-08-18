<template>
  <div class="horizon-monitor">
    <!-- 顶部状态栏 -->
    <div class="art-card p-4 mb-4 flex-cb">
      <div class="flex-c gap-3">
        <ArtSvgIcon icon="ri:flow-chart" class="text-lg text-theme" />
        <h3 class="text-base font-medium text-g-900">队列监控</h3>
        <ElTag :type="statusTagType(stats?.status || 'inactive')" effect="dark" size="small">
          {{ statusLabel(stats?.status || 'inactive') }}
        </ElTag>
        <span class="text-xs text-g-400">最近刷新：{{ lastRefresh }}</span>
      </div>
      <ElButton :icon="Refresh" :loading="loading" size="small" circle @click="refreshCore" />
    </div>

    <!-- KPI 统计卡片 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div class="art-card p-4">
        <div class="text-xs text-g-500 mb-1">最近失败任务</div>
        <div class="text-2xl font-bold text-g-900 tabular-nums">{{ stats?.failedJobs ?? '—' }}</div>
        <div class="text-xs text-g-400 mt-1">近 {{ stats?.periods?.failedJobs ?? 0 }} 分钟内</div>
      </div>
      <div class="art-card p-4">
        <div class="text-xs text-g-500 mb-1">每分钟处理</div>
        <div class="text-2xl font-bold text-g-900 tabular-nums">{{
          stats?.jobsPerMinute ?? '—'
        }}</div>
        <div class="text-xs text-g-400 mt-1">jobs/min</div>
      </div>
      <div class="art-card p-4">
        <div class="text-xs text-g-500 mb-1">工作进程</div>
        <div class="text-2xl font-bold text-g-900 tabular-nums">{{ stats?.processes ?? '—' }}</div>
        <div class="text-xs text-g-400 mt-1">{{ stats?.pausedMasters ?? 0 }} 个已暂停 Master</div>
      </div>
      <div class="art-card p-4">
        <div class="text-xs text-g-500 mb-1">最近任务</div>
        <div class="text-2xl font-bold text-g-900 tabular-nums">{{ stats?.recentJobs ?? '—' }}</div>
        <div class="text-xs text-g-400 mt-1">近 {{ stats?.periods?.recentJobs ?? 0 }} 分钟内</div>
      </div>
    </div>

    <!-- Tab 区域 -->
    <div class="art-card p-4">
      <ElTabs v-model="activeTab">
        <!-- 工作负载 -->
        <ElTabPane label="工作负载" name="workload">
          <div v-loading="workloadLoading" class="min-h-[200px]">
            <ElEmpty v-if="!workload.length" description="暂无工作负载数据" :image-size="80" />
            <div v-else class="space-y-2">
              <div
                v-for="item in workload"
                :key="item.name + item.queue"
                class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_120px_80px_80px_80px] gap-x-4 gap-y-1 items-center py-2 px-2 rounded-custom-xs hover:bg-hover-color tad-200 border-b-d last:border-b-0"
              >
                <div>
                  <span class="text-sm font-medium text-g-800">{{ item.queue || item.name }}</span>
                  <span class="text-xs text-g-400 ml-2">{{ item.connection }}</span>
                </div>
                <div class="text-sm text-g-700 tabular-nums text-right">
                  <span class="text-xs text-g-400">长度</span> {{ item.length }}
                </div>
                <div class="text-sm text-g-700 tabular-nums text-right">
                  <span class="text-xs text-g-400">等待</span> {{ item.wait }}s
                </div>
                <div class="text-sm text-g-700 tabular-nums text-right">
                  <span class="text-xs text-g-400">进程</span> {{ item.processes }}
                </div>
                <div></div>
              </div>
            </div>
          </div>
        </ElTabPane>

        <!-- 主监督器 -->
        <ElTabPane label="主监督器" name="masters">
          <div v-loading="mastersLoading" class="min-h-[200px]">
            <ElEmpty v-if="!masters.length" description="暂无监督器数据" :image-size="80" />
            <div v-else class="space-y-3">
              <div v-for="master in masters" :key="master.name">
                <div class="flex-c gap-2 mb-1.5">
                  <ElTag :type="statusTagType(master.status)" size="small" effect="dark">
                    {{ master.status }}
                  </ElTag>
                  <span class="text-sm font-medium text-g-800">{{ master.name }}</span>
                </div>
                <div class="pl-4 space-y-1.5">
                  <div
                    v-for="supervisor in master.supervisors"
                    :key="supervisor.name"
                    class="flex-c gap-3 p-2 rounded-custom-xs hover:bg-hover-color tad-200"
                  >
                    <ElTag :type="statusTagType(supervisor.status)" size="small" effect="light">
                      {{ supervisor.status }}
                    </ElTag>
                    <span class="text-sm text-g-700 truncate">{{ supervisor.name }}</span>
                    <span class="text-xs text-g-400 ml-auto">{{
                      supervisor.options?.queue || '—'
                    }}</span>
                    <span class="text-xs text-g-500 tabular-nums">
                      进程 {{ supervisor.processes?.length ?? 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElTabPane>

        <!-- 标签监控 -->
        <ElTabPane label="标签监控" name="monitoring">
          <div class="flex-cb mb-4">
            <span class="text-sm text-g-600">监控中的标签</span>
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
                class="flex-cb p-2.5 rounded-custom-xs hover:bg-hover-color tad-200"
              >
                <ElTag type="info" effect="plain" size="small">{{ tag.tag }}</ElTag>
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
        </ElTabPane>

        <!-- 任务指标 -->
        <ElTabPane label="任务指标" name="jobMetrics">
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
        </ElTabPane>

        <!-- 队列指标 -->
        <ElTabPane label="队列指标" name="queueMetrics">
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
        </ElTabPane>

        <!-- 批处理 -->
        <ElTabPane label="批处理" name="batches">
          <div v-loading="batchesLoading" class="min-h-[200px]">
            <ElEmpty v-if="!batches.length" description="暂无批处理数据" :image-size="80" />
            <div v-else class="space-y-2">
              <div
                v-for="batch in batches"
                :key="batch.id"
                class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_100px_100px_100px_80px] gap-x-4 items-center py-2.5 px-2 rounded-custom-xs hover:bg-hover-color tad-200 border-b-d last:border-b-0 cursor-pointer"
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
                  <span :class="batch.failed_jobs > 0 ? 'text-danger font-bold' : 'text-g-700'">
                    {{ batch.failed_jobs }}
                  </span>
                </div>
                <div class="text-right">
                  <ElTag size="small" :type="batchStatusType(batch)" effect="light">
                    {{ batchStatusLabel(batch) }}
                  </ElTag>
                </div>
              </div>
            </div>
          </div>
        </ElTabPane>

        <!-- 失败任务 -->
        <ElTabPane label="失败任务" name="failed">
          <JobList
            type="failed"
            title="失败任务"
            @show-detail="showJobDetail"
            @retry="handleRetry"
          />
        </ElTabPane>

        <!-- 待处理任务 -->
        <ElTabPane label="待处理" name="pending">
          <JobList type="pending" title="待处理任务" @show-detail="showJobDetail" />
        </ElTabPane>

        <!-- 已完成任务 -->
        <ElTabPane label="已完成" name="completed">
          <JobList type="completed" title="已完成任务" @show-detail="showJobDetail" />
        </ElTabPane>

        <!-- 静默任务 -->
        <ElTabPane label="静默任务" name="silenced">
          <JobList type="silenced" title="静默任务" @show-detail="showJobDetail" />
        </ElTabPane>
      </ElTabs>
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

          <!-- 异常堆栈 -->
          <div v-if="jobDetail.exception">
            <div class="text-xs text-g-500 mb-1">异常信息</div>
            <pre
              class="art-card p-3 text-xs text-danger font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap"
              >{{ jobDetail.exception }}</pre>
          </div>

          <!-- Payload -->
          <div v-if="jobDetail.payload">
            <div class="text-xs text-g-500 mb-1">Payload</div>
            <pre
              class="art-card p-3 text-xs text-g-700 font-mono overflow-x-auto max-h-[200px] overflow-y-auto"
              >{{ JSON.stringify(jobDetail.payload, null, 2) }}</pre>
          </div>

          <!-- 重试记录 -->
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

          <!-- 重试按钮 -->
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
              >
                {{ batchDetail.batch.failed_jobs }}
              </div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">进度</div>
              <ElProgress
                :percentage="Math.round(batchDetail.batch.progress)"
                :status="batchDetail.batch.failed_jobs > 0 ? 'warning' : 'success'"
              />
            </div>
          </div>

          <!-- 失败任务列表 -->
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

  // ===== 核心数据（高频轮询） =====
  const loading = ref(false)
  const stats = ref<HorizonStats>()
  const workload = ref<HorizonWorkload[]>([])
  const workloadLoading = ref(false)
  const masters = ref<HorizonMaster[]>([])
  const mastersLoading = ref(false)
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

  // ===== Tab 控制 =====
  const activeTab = ref('workload')

  // ===== 工具函数 =====

  function statusTagType(status: string): 'success' | 'warning' | 'info' | 'danger' {
    switch (status) {
      case 'running':
        return 'success'
      case 'paused':
        return 'warning'
      case 'inactive':
        return 'info'
      default:
        return 'info'
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case 'running':
        return '运行中'
      case 'paused':
        return '已暂停'
      case 'inactive':
        return '未激活'
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
      // 静默处理，轮询场景下错误不应弹出
    }
  }

  async function fetchWorkload() {
    workloadLoading.value = true
    try {
      workload.value = await fetchHorizonWorkload()
    } finally {
      workloadLoading.value = false
    }
  }

  async function fetchMasters() {
    mastersLoading.value = true
    try {
      masters.value = await fetchHorizonMasters()
    } finally {
      mastersLoading.value = false
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
      // 加载每个 job 的快照
      const results = await Promise.all(
        list.map(async (id) => {
          const snapshots = await fetchHorizonJobMetricsDetail(id)
          return { id, snapshots }
        })
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
        list.map(async (id) => {
          const snapshots = await fetchHorizonQueueMetricsDetail(id)
          return { id, snapshots }
        })
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
      // 尝试通用详情接口，失败则用 failed 详情接口
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

  // ===== Tab 切换时按需加载 =====
  function onTabChange(tab: string) {
    if (tab === 'jobMetrics' && !jobMetricsList.value.length) fetchJobMetrics()
    if (tab === 'queueMetrics' && !queueMetricsList.value.length) fetchQueueMetrics()
    if (tab === 'batches' && !batches.value.length) fetchBatches()
    if (tab === 'monitoring' && !monitoringTags.value.length) fetchTags()
  }

  watch(activeTab, onTabChange)

  onMounted(() => {
    // 核心：5s 轮询
    startPoll(fetchStats, 5000)
    startPoll(fetchWorkload, 5000)
    startPoll(fetchMasters, 5000)
    // 标签：10s 轮询
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
</style>
