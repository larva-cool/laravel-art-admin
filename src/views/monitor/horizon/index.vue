<template>
  <div class="horizon-monitor">
    <!-- 顶部工具栏 -->
    <div class="art-card p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-2">
        <ArtSvgIcon icon="ri:flow-chart" class="text-lg text-theme" />
        <h3 class="text-base font-medium text-g-900">{{ $t('monitor.horizon.title') }}</h3>
        <ElTag size="small" :type="statusTagType(stats?.status || 'inactive')" effect="dark">
          {{ statusLabel(stats?.status || 'inactive') }}
        </ElTag>
        <span class="text-xs text-g-400">{{
          $t('monitor.horizon.lastRefresh', { time: lastRefresh })
        }}</span>
      </div>
      <div class="flex items-center gap-2">
        <ElButton :icon="Refresh" :loading="loading" circle @click="refreshCore" />
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-start gap-4">
      <!-- 左侧：导航 -->
      <div class="w-full md:w-66 shrink-0">
        <div class="art-card p-4 mb-4">
          <div class="text-xs uppercase font-bold text-g-500 mb-2">{{
            $t('monitor.horizon.navTitle')
          }}</div>
          <div class="space-y-0.5">
            <div
              v-for="item in navItems"
              :key="item.key"
              class="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-200"
              :class="
                activeView === item.key
                  ? 'bg-theme/10 text-theme font-medium'
                  : 'text-g-700 hover:bg-hover-color'
              "
              @click="switchView(item.key)"
            >
              <ArtSvgIcon :icon="item.icon" class="text-base shrink-0" />
              <span class="text-sm truncate">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：内容 -->
      <div class="flex-1 min-w-0 w-full">
        <!-- ===== Dashboard ===== -->
        <template v-if="activeView === 'dashboard'">
          <div v-loading="loading" class="min-h-[400px]">
            <!-- Overview -->
            <div class="art-card p-5 mb-4">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ $t('monitor.horizon.overview') }}</h4>
                  <p>{{ $t('monitor.horizon.overviewSubtitle') }}</p>
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.jobsPerMinute')
                  }}</div>
                  <div class="text-xl font-bold text-g-900 mt-1.5 tabular-nums">{{
                    stats?.jobsPerMinute ?? 0
                  }}</div>
                  <div class="text-xs text-g-400 mt-0.5">jobs/min</div>
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.recentJobs')
                  }}</div>
                  <div class="text-xl font-bold text-g-900 mt-1.5 tabular-nums">{{
                    stats?.recentJobs ?? 0
                  }}</div>
                  <div class="text-xs text-g-400 mt-0.5">{{
                    $t('monitor.horizon.recentJobsPeriod', {
                      minutes: stats?.periods?.recentJobs ?? 0
                    })
                  }}</div>
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.failedJobs')
                  }}</div>
                  <div class="text-xl font-bold text-g-900 mt-1.5 tabular-nums">{{
                    stats?.failedJobs ?? 0
                  }}</div>
                  <div class="text-xs text-g-400 mt-0.5">{{
                    $t('monitor.horizon.failedJobsPeriod', {
                      minutes: stats?.periods?.failedJobs ?? 0
                    })
                  }}</div>
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.status')
                  }}</div>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span
                      class="rounded-full"
                      :class="statusDotClass(stats?.status || 'inactive')"
                      style="width: 8px; height: 8px"
                    ></span>
                    <span class="text-base font-medium text-g-800">{{
                      statusLabel(stats?.status || 'inactive')
                    }}</span>
                  </div>
                  <div
                    v-if="stats?.status === 'running' && stats.pausedMasters > 0"
                    class="text-xs text-g-400 mt-0.5"
                    >{{ $t('monitor.horizon.pausedMasters', { n: stats.pausedMasters }) }}</div
                  >
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.totalProcesses')
                  }}</div>
                  <div class="text-xl font-bold text-g-900 mt-1.5 tabular-nums">{{
                    stats?.processes ?? 0
                  }}</div>
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.maxWaitTime')
                  }}</div>
                  <div class="text-base font-medium text-g-800 mt-1.5">{{ maxWaitTime }}</div>
                  <div v-if="maxWaitQueue" class="text-xs text-g-400 mt-0.5">{{
                    maxWaitQueue
                  }}</div>
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.longestRuntime')
                  }}</div>
                  <div class="text-base font-medium text-g-800 mt-1.5">{{
                    stats?.queueWithMaxRuntime || '—'
                  }}</div>
                </div>
                <div class="p-3 rounded-md bg-(--art-gray-100)">
                  <div class="text-xs uppercase font-bold text-g-500">{{
                    $t('monitor.horizon.maxThroughput')
                  }}</div>
                  <div class="text-base font-medium text-g-800 mt-1.5">{{
                    stats?.queueWithMaxThroughput || '—'
                  }}</div>
                </div>
              </div>
            </div>

            <!-- Current Workload -->
            <div v-if="workload.length" class="art-card p-5 mb-4">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ $t('monitor.horizon.currentWorkload') }}</h4>
                  <p>{{ $t('monitor.horizon.currentWorkloadSubtitle') }}</p>
                </div>
              </div>
              <div class="mt-3">
                <div
                  class="hidden lg:grid grid-cols-[minmax(0,2fr)_100px_100px_120px] gap-x-4 px-1 pb-2 border-b-d text-xs uppercase font-bold text-g-500"
                >
                  <div>{{ $t('monitor.horizon.queue') }}</div>
                  <div class="text-right">{{ $t('monitor.horizon.jobCount') }}</div>
                  <div class="text-right">{{ $t('monitor.horizon.processCount') }}</div>
                  <div class="text-right">{{ $t('monitor.horizon.wait') }}</div>
                </div>
                <div
                  v-for="item in workload"
                  :key="item.name + item.queue"
                  class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_100px_100px_120px] gap-x-4 gap-y-1 items-center py-2.5 px-1 border-b-d last:border-b-0 hover:bg-hover-color transition-all duration-200 rounded-md"
                >
                  <div class="text-sm font-medium text-g-800">{{
                    item.name.replace(/,/g, ', ')
                  }}</div>
                  <div class="text-sm text-g-600 tabular-nums lg:text-right">{{
                    item.length ?? 0
                  }}</div>
                  <div class="text-sm text-g-600 tabular-nums lg:text-right">{{
                    item.processes ?? 0
                  }}</div>
                  <div class="text-sm text-g-600 tabular-nums lg:text-right">{{
                    humanTime(item.wait)
                  }}</div>
                </div>
              </div>
            </div>

            <!-- Worker Cards -->
            <div v-for="worker in masters" :key="worker.name" class="art-card p-5 mb-4">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ worker.name }}</h4>
                  <p>
                    <ElTag size="small" :type="statusTagType(worker.status)" effect="light">{{
                      statusLabel(worker.status)
                    }}</ElTag>
                  </p>
                </div>
              </div>
              <div class="mt-3">
                <div
                  class="hidden lg:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_100px_120px] gap-x-4 px-1 pb-2 border-b-d text-xs uppercase font-bold text-g-500"
                >
                  <div>Supervisor</div>
                  <div>{{ $t('monitor.horizon.queue') }}</div>
                  <div class="text-right">{{ $t('monitor.horizon.processCount') }}</div>
                  <div class="text-right">{{ $t('monitor.horizon.balanceStrategy') }}</div>
                </div>
                <div
                  v-for="supervisor in worker.supervisors"
                  :key="supervisor.name"
                  class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_100px_120px] gap-x-4 gap-y-1 items-center py-2.5 px-1 border-b-d last:border-b-0 hover:bg-hover-color transition-all duration-200 rounded-md"
                >
                  <div class="flex items-center gap-1.5">
                    <span
                      v-if="supervisor.status === 'paused'"
                      class="rounded-full bg-warning"
                      style="width: 8px; height: 8px"
                    ></span>
                    <span
                      v-else-if="supervisor.status === 'inactive'"
                      class="rounded-full bg-danger"
                      style="width: 8px; height: 8px"
                    ></span>
                    <span class="text-sm text-g-800">{{
                      supervisorName(supervisor.name, worker.name)
                    }}</span>
                  </div>
                  <div class="text-sm text-g-600 truncate">{{
                    supervisor.options?.queue?.replace(/,/g, ', ') || '—'
                  }}</div>
                  <div class="text-sm text-g-600 tabular-nums lg:text-right">{{
                    countProcesses(supervisor.processes)
                  }}</div>
                  <div class="text-sm text-g-600 lg:text-right">{{
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
          <div class="art-card p-5">
            <div class="art-card-header">
              <div class="title">
                <h4>{{ $t('monitor.horizon.monitoring') }}</h4>
                <p>{{ $t('monitor.horizon.monitoringSubtitle') }}</p>
              </div>
              <div class="flex items-center gap-2">
                <ElInput
                  v-model="newTag"
                  :placeholder="$t('monitor.horizon.tagPlaceholder')"
                  style="width: 180px"
                  @keyup.enter="addTag"
                />
                <ElButton type="primary" :icon="Plus" @click="addTag">{{
                  $t('monitor.horizon.add')
                }}</ElButton>
              </div>
            </div>
            <div v-loading="tagsLoading" class="mt-3">
              <ElEmpty
                v-if="!monitoringTags.length"
                :description="$t('monitor.horizon.noTags')"
                :image-size="60"
              />
              <div v-else class="space-y-1.5">
                <div
                  v-for="tag in monitoringTags"
                  :key="tag.tag"
                  class="flex items-center justify-between p-2.5 rounded-md hover:bg-hover-color transition-all duration-200 border-b-d last:border-b-0"
                >
                  <ElTag type="info" effect="plain" size="small">{{ tag.tag }}</ElTag>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-g-700 tabular-nums">{{
                      $t('monitor.horizon.tagCount', { n: tag.count })
                    }}</span>
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
          <!-- 列表视图 -->
          <div v-if="!selectedMetric" class="art-card p-5">
            <div class="art-card-header">
              <div class="title">
                <h4>{{ $t('monitor.horizon.jobMetrics') }}</h4>
                <p>{{ $t('monitor.horizon.jobMetricsTotal', { n: jobMetricsList.length }) }}</p>
              </div>
            </div>
            <div v-loading="jobMetricsLoading" class="mt-3">
              <ElEmpty
                v-if="!jobMetricsList.length && !jobMetricsLoading"
                :description="$t('monitor.horizon.noJobMetrics')"
                :image-size="60"
              />
              <div v-else class="space-y-1.5">
                <div
                  v-for="jobId in jobMetricsList"
                  :key="jobId"
                  class="flex items-center gap-2 py-2.5 px-1 border-b-d last:border-b-0 hover:bg-hover-color transition-all duration-200 rounded-md cursor-pointer"
                  @click="showMetricDetail('jobs', jobId)"
                >
                  <span class="text-sm text-g-800 truncate font-mono">{{ jobId }}</span>
                  <ElIcon class="ml-auto text-g-400"><ArrowRight /></ElIcon>
                </div>
              </div>
            </div>
          </div>
          <!-- 详情视图 -->
          <div v-else class="space-y-4">
            <div class="art-card p-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElButton text :icon="ArrowLeft" @click="selectedMetric = ''">{{
                  $t('monitor.horizon.back')
                }}</ElButton>
                <span class="text-sm font-medium text-g-800">{{ selectedMetric }}</span>
              </div>
            </div>
            <div v-loading="metricDetailLoading" class="art-card p-5">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ $t('monitor.horizon.throughput') }}</h4>
                  <p>{{ $t('monitor.horizon.throughputEn') }}</p>
                </div>
              </div>
              <div class="mt-3">
                <ElEmpty
                  v-if="!metricSnapshots.length && !metricDetailLoading"
                  :description="$t('monitor.horizon.insufficientData')"
                  :image-size="60"
                />
                <MetricsChart v-else :snapshots="metricSnapshots" metric="throughput" />
              </div>
            </div>
            <div class="art-card p-5">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ $t('monitor.horizon.runtime') }}</h4>
                  <p>{{ $t('monitor.horizon.runtimeEn') }}</p>
                </div>
              </div>
              <div class="mt-3">
                <ElEmpty
                  v-if="!metricSnapshots.length && !metricDetailLoading"
                  :description="$t('monitor.horizon.insufficientData')"
                  :image-size="60"
                />
                <MetricsChart v-else :snapshots="metricSnapshots" metric="runtime" />
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Metrics: Queues ===== -->
        <template v-else-if="activeView === 'metrics-queues'">
          <!-- 列表视图 -->
          <div v-if="!selectedMetric" class="art-card p-5">
            <div class="art-card-header">
              <div class="title">
                <h4>{{ $t('monitor.horizon.queueMetrics') }}</h4>
                <p>{{ $t('monitor.horizon.queueMetricsTotal', { n: queueMetricsList.length }) }}</p>
              </div>
            </div>
            <div v-loading="queueMetricsLoading" class="mt-3">
              <ElEmpty
                v-if="!queueMetricsList.length && !queueMetricsLoading"
                :description="$t('monitor.horizon.noQueueMetrics')"
                :image-size="60"
              />
              <div v-else class="space-y-1.5">
                <div
                  v-for="queueId in queueMetricsList"
                  :key="queueId"
                  class="flex items-center gap-2 py-2.5 px-1 border-b-d last:border-b-0 hover:bg-hover-color transition-all duration-200 rounded-md cursor-pointer"
                  @click="showMetricDetail('queues', queueId)"
                >
                  <span class="text-sm text-g-800 truncate font-mono">{{ queueId }}</span>
                  <ElIcon class="ml-auto text-g-400"><ArrowRight /></ElIcon>
                </div>
              </div>
            </div>
          </div>
          <!-- 详情视图 -->
          <div v-else class="space-y-4">
            <div class="art-card p-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ElButton text :icon="ArrowLeft" @click="selectedMetric = ''">{{
                  $t('monitor.horizon.back')
                }}</ElButton>
                <span class="text-sm font-medium text-g-800">{{ selectedMetric }}</span>
              </div>
            </div>
            <div v-loading="metricDetailLoading" class="art-card p-5">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ $t('monitor.horizon.throughput') }}</h4>
                  <p>{{ $t('monitor.horizon.throughputEn') }}</p>
                </div>
              </div>
              <div class="mt-3">
                <ElEmpty
                  v-if="!metricSnapshots.length && !metricDetailLoading"
                  :description="$t('monitor.horizon.insufficientData')"
                  :image-size="60"
                />
                <MetricsChart v-else :snapshots="metricSnapshots" metric="throughput" />
              </div>
            </div>
            <div class="art-card p-5">
              <div class="art-card-header">
                <div class="title">
                  <h4>{{ $t('monitor.horizon.runtime') }}</h4>
                  <p>{{ $t('monitor.horizon.runtimeEn') }}</p>
                </div>
              </div>
              <div class="mt-3">
                <ElEmpty
                  v-if="!metricSnapshots.length && !metricDetailLoading"
                  :description="$t('monitor.horizon.insufficientData')"
                  :image-size="60"
                />
                <MetricsChart v-else :snapshots="metricSnapshots" metric="runtime" />
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Batches ===== -->
        <template v-else-if="activeView === 'batches'">
          <div class="art-card p-5">
            <div class="art-card-header">
              <div class="title">
                <h4>{{ $t('monitor.horizon.batches') }}</h4>
                <p>{{ $t('monitor.horizon.batchesTotal', { n: batches.length }) }}</p>
              </div>
            </div>
            <div v-loading="batchesLoading" class="mt-3">
              <ElEmpty
                v-if="!batches.length"
                :description="$t('monitor.horizon.noBatches')"
                :image-size="60"
              />
              <div v-else class="space-y-1.5">
                <div
                  v-for="batch in batches"
                  :key="batch.id"
                  class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_100px_100px_100px_80px] gap-x-4 gap-y-1 items-center py-2.5 px-1 border-b-d last:border-b-0 hover:bg-hover-color transition-all duration-200 rounded-md cursor-pointer"
                  @click="showBatchDetail(batch.id)"
                >
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-g-800 truncate">{{ batch.name }}</div>
                    <div class="text-xs text-g-400 font-mono truncate">{{ batch.id }}</div>
                  </div>
                  <div class="text-sm text-g-700 tabular-nums lg:text-right">
                    <span class="text-xs text-g-400">{{ $t('monitor.horizon.total') }}</span>
                    {{ batch.total_jobs }}
                  </div>
                  <div class="text-sm text-g-700 tabular-nums lg:text-right">
                    <span class="text-xs text-g-400">{{ $t('monitor.horizon.processed') }}</span>
                    {{ batch.processed_jobs }}
                  </div>
                  <div class="text-sm tabular-nums lg:text-right">
                    <span class="text-xs text-g-400">{{ $t('monitor.horizon.failed') }}</span>
                    <span :class="batch.failed_jobs > 0 ? 'text-danger font-bold' : 'text-g-700'">{{
                      batch.failed_jobs
                    }}</span>
                  </div>
                  <div class="lg:text-right">
                    <ElTag size="small" :type="batchStatusType(batch)" effect="light">{{
                      batchStatusLabel(batch)
                    }}</ElTag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== Job Lists ===== -->
        <template v-else>
          <div class="art-card p-5">
            <div class="art-card-header">
              <div class="title">
                <h4>{{ currentNavLabel }}</h4>
                <p>{{ $t('monitor.horizon.clickToView') }}</p>
              </div>
            </div>
            <div class="mt-3">
              <JobList
                :type="activeView as any"
                :title="currentNavLabel"
                @show-detail="showJobDetail"
                @retry="handleRetry"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 任务详情抽屉 -->
    <ElDrawer
      v-model="jobDrawerVisible"
      :title="$t('monitor.horizon.jobDetail')"
      size="60%"
      :destroy-on-close="true"
    >
      <div v-loading="jobDetailLoading" class="p-4 space-y-4">
        <template v-if="jobDetail">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.jobName') }}</div>
              <div class="text-sm text-g-800 font-mono break-all">{{ jobDetail.name }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.jobId') }}</div>
              <div class="text-sm text-g-700 font-mono break-all">{{ jobDetail.id }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.queueField') }}</div>
              <div class="text-sm text-g-700">{{ jobDetail.queue }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.statusField') }}</div>
              <ElTag :type="jobStatusTagType(jobDetail.status)" size="small">{{
                jobDetail.status
              }}</ElTag>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.connectionField') }}</div>
              <div class="text-sm text-g-700">{{ jobDetail.connection }}</div>
            </div>
            <div v-if="jobDetail.failed_at || jobDetail.completed_at">
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.timeField') }}</div>
              <div class="text-sm text-g-700">{{
                jobDetail.failed_at || jobDetail.completed_at
              }}</div>
            </div>
          </div>

          <div v-if="jobDetail.exception">
            <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.exceptionInfo') }}</div>
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
            <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.retryHistory') }}</div>
            <div class="space-y-1">
              <div
                v-for="(retry, idx) in jobDetail.retried_by"
                :key="idx"
                class="flex items-center gap-2 p-2 rounded-md bg-(--art-gray-100)"
              >
                <span class="text-xs text-g-600 font-mono">{{ retry.retried_at }}</span>
              </div>
            </div>
          </div>

          <div v-if="jobDetail.status === 'failed'">
            <ElButton type="primary" @click="retryFromDrawer">{{
              $t('monitor.horizon.retryJob')
            }}</ElButton>
          </div>
        </template>
      </div>
    </ElDrawer>

    <!-- 批处理详情抽屉 -->
    <ElDrawer
      v-model="batchDrawerVisible"
      :title="$t('monitor.horizon.batchDetail')"
      size="60%"
      :destroy-on-close="true"
    >
      <div v-loading="batchDetailLoading" class="p-4 space-y-4">
        <template v-if="batchDetail?.batch">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.name') }}</div>
              <div class="text-sm text-g-800">{{ batchDetail.batch.name }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.id') }}</div>
              <div class="text-sm text-g-700 font-mono break-all">{{ batchDetail.batch.id }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.totalJobs') }}</div>
              <div class="text-sm text-g-700 tabular-nums">{{ batchDetail.batch.total_jobs }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.processed') }}</div>
              <div class="text-sm text-g-700 tabular-nums">{{
                batchDetail.batch.processed_jobs
              }}</div>
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.failed') }}</div>
              <div
                class="text-sm tabular-nums"
                :class="batchDetail.batch.failed_jobs > 0 ? 'text-danger font-bold' : 'text-g-700'"
                >{{ batchDetail.batch.failed_jobs }}</div
              >
            </div>
            <div>
              <div class="text-xs text-g-500 mb-1">{{ $t('monitor.horizon.progress') }}</div>
              <ElProgress
                :percentage="Math.round(batchDetail.batch.progress)"
                :status="batchDetail.batch.failed_jobs > 0 ? 'warning' : 'success'"
              />
            </div>
          </div>

          <div v-if="batchDetail.failedJobs?.length">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-g-500">{{
                $t('monitor.horizon.failedJobsTitle', { n: batchDetail.failedJobs.length })
              }}</span>
              <ElButton type="primary" @click="retryBatch(batchDetail.batch.id)">{{
                $t('monitor.horizon.retryAllFailed')
              }}</ElButton>
            </div>
            <div class="space-y-1.5">
              <div
                v-for="job in batchDetail.failedJobs"
                :key="job.id"
                class="flex items-center gap-2 p-2 rounded-md bg-(--art-gray-100) cursor-pointer"
                @click="handleJobFromBatch(String(job.id))"
              >
                <ElTag type="danger" size="small">{{ $t('monitor.horizon.failed') }}</ElTag>
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
  import { Refresh, Plus, Delete, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import MetricsChart from './components/MetricsChart.vue'
  import JobList from './components/JobList.vue'

  const { t } = useI18n()

  defineOptions({ name: 'HorizonMonitor' })

  // ===== 导航 =====
  interface NavItem {
    key: string
    label: string
    icon: string
  }

  const navItems: NavItem[] = [
    { key: 'dashboard', label: t('monitor.horizon.nav.dashboard'), icon: 'ri:dashboard-line' },
    { key: 'monitoring', label: t('monitor.horizon.nav.monitoring'), icon: 'ri:eye-line' },
    { key: 'metrics-jobs', label: t('monitor.horizon.nav.metricsJobs'), icon: 'ri:bar-chart-line' },
    {
      key: 'metrics-queues',
      label: t('monitor.horizon.nav.metricsQueues'),
      icon: 'ri:line-chart-line'
    },
    { key: 'batches', label: t('monitor.horizon.nav.batches'), icon: 'ri:stack-line' },
    { key: 'pending', label: t('monitor.horizon.nav.pending'), icon: 'ri:pause-circle-line' },
    {
      key: 'completed',
      label: t('monitor.horizon.nav.completed'),
      icon: 'ri:checkbox-circle-line'
    },
    { key: 'silenced', label: t('monitor.horizon.nav.silenced'), icon: 'ri:volume-mute-line' },
    { key: 'failed', label: t('monitor.horizon.nav.failed'), icon: 'ri:error-warning-line' }
  ]

  const activeView = ref('dashboard')

  const currentNavLabel = computed(
    () => navItems.find((n) => n.key === activeView.value)?.label || ''
  )

  function switchView(key: string) {
    activeView.value = key
    selectedMetric.value = ''
    if (key === 'metrics-jobs' && !jobMetricsList.value.length) fetchJobMetrics()
    if (key === 'metrics-queues' && !queueMetricsList.value.length) fetchQueueMetrics()
    if (key === 'batches' && !batches.value.length) fetchBatches()
    if (key === 'monitoring' && !monitoringTags.value.length) fetchTags()
  }

  // ===== 核心数据 =====
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
  const jobMetricsLoading = ref(false)
  const queueMetricsList = ref<string[]>([])
  const queueMetricsLoading = ref(false)
  const selectedMetric = ref('')
  const metricSnapshots = ref<HorizonMetricSnapshot[]>([])
  const metricDetailLoading = ref(false)

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
        return 'Active'
      case 'paused':
        return 'Paused'
      case 'inactive':
        return 'Inactive'
      default:
        return status
    }
  }

  function statusDotClass(status: string): string {
    switch (status) {
      case 'running':
        return 'bg-success'
      case 'paused':
        return 'bg-warning'
      case 'inactive':
        return 'bg-danger'
      default:
        return 'bg-g-400'
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

  function humanTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—'
    if (seconds < 60) return t('monitor.horizon.time.seconds', { n: seconds })
    if (seconds < 3600) return t('monitor.horizon.time.minutes', { n: Math.floor(seconds / 60) })
    return t('monitor.horizon.time.hours', { n: Math.floor(seconds / 3600) })
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
    if (batch.cancelled_at) return t('monitor.horizon.batchStatus.cancelled')
    if (batch.failed_jobs > 0) return t('monitor.horizon.batchStatus.hasFailures')
    if (batch.finished_at) return t('monitor.horizon.batchStatus.finished')
    return t('monitor.horizon.batchStatus.processing')
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
      ElMessage.success(t('monitor.horizon.msg.tagAdded'))
      fetchTags()
    } catch {
      ElMessage.error(t('monitor.horizon.msg.addFailed'))
    }
  }

  async function removeTag(tag: string) {
    try {
      await stopMonitoringHorizonTag(tag)
      ElMessage.success(t('monitor.horizon.msg.tagRemoved'))
      fetchTags()
    } catch {
      ElMessage.error(t('monitor.horizon.msg.removeFailed'))
    }
  }

  async function fetchJobMetrics() {
    jobMetricsLoading.value = true
    try {
      jobMetricsList.value = await fetchHorizonJobMetrics()
    } finally {
      jobMetricsLoading.value = false
    }
  }

  async function fetchQueueMetrics() {
    queueMetricsLoading.value = true
    try {
      queueMetricsList.value = await fetchHorizonQueueMetrics()
    } finally {
      queueMetricsLoading.value = false
    }
  }

  async function showMetricDetail(type: 'jobs' | 'queues', slug: string) {
    selectedMetric.value = slug
    metricDetailLoading.value = true
    metricSnapshots.value = []
    try {
      if (type === 'jobs') {
        metricSnapshots.value = await fetchHorizonJobMetricsDetail(slug)
      } else {
        metricSnapshots.value = await fetchHorizonQueueMetricsDetail(slug)
      }
    } finally {
      metricDetailLoading.value = false
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
      ElMessage.success(t('monitor.horizon.msg.retrySubmitted'))
      showBatchDetail(id)
    } catch {
      ElMessage.error(t('monitor.horizon.msg.retryFailed'))
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
      ElMessage.success(t('monitor.horizon.msg.retrySubmitted'))
    } catch {
      ElMessage.error(t('monitor.horizon.msg.retryFailed'))
    }
  }

  async function retryFromDrawer() {
    if (!jobDetail.value) return
    await handleRetry(String(jobDetail.value.id))
    jobDrawerVisible.value = false
  }

  function handleJobFromBatch(id: string) {
    showJobDetail(id)
    batchDrawerVisible.value = false
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
</style>
