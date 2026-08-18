<template>
  <div class="job-list">
    <div v-loading="loading" class="min-h-[300px]">
      <ElEmpty v-if="!jobs.length && !loading" :description="title + '为空'" :image-size="80" />
      <div v-else>
        <!-- 表头 -->
        <div class="job-header hidden md:grid">
          <div>任务</div>
          <div>队列</div>
          <div>状态</div>
          <div class="text-right">时间</div>
          <div v-if="type === 'failed'" class="w-16"></div>
        </div>
        <!-- 任务行 -->
        <div
          v-for="job in jobs"
          :key="job.id"
          class="job-row"
          @click="$emit('showDetail', String(job.id))"
        >
          <div class="job-main">
            <div class="job-name" :title="job.name">{{ simplifyName(job.name) }}</div>
            <div class="job-id text-xs text-g-400 font-mono truncate">{{ job.id }}</div>
          </div>
          <div class="job-queue hidden md:block">
            <ElTag size="small" type="info" effect="plain">{{ job.queue }}</ElTag>
          </div>
          <div class="job-status">
            <ElTag size="small" :type="statusTagType(job.status)" effect="light">
              {{ job.status }}
            </ElTag>
          </div>
          <div
            class="job-time text-xs text-g-500 tabular-nums hidden md:block text-right whitespace-nowrap"
          >
            {{ formatTime(job.failed_at || job.completed_at || job.created_at || '') }}
          </div>
          <div v-if="type === 'failed'" class="job-action">
            <ElButton size="small" type="primary" text @click.stop="handleRetry(String(job.id))"
              >重试</ElButton
            >
          </div>
        </div>
        <!-- 加载更多 -->
        <div v-if="hasMore" class="text-center py-4">
          <ElButton size="small" text :loading="loading" @click="loadMore">加载更多</ElButton>
        </div>
        <div v-else-if="jobs.length" class="text-center py-4 text-xs text-g-400">
          共 {{ total }} 条
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchHorizonCompletedJobs,
    fetchHorizonFailedJobs,
    fetchHorizonPendingJobs,
    fetchHorizonSilencedJobs,
    retryHorizonJob,
    type HorizonJob,
    type HorizonJobListResponse
  } from '@/api/queue'
  import { ElMessage } from 'element-plus'

  type FetchFn = (params?: any) => Promise<HorizonJobListResponse>

  const props = withDefaults(
    defineProps<{
      fetchFn?: FetchFn
      title?: string
      type?: 'pending' | 'completed' | 'failed' | 'silenced' | 'monitoring'
      extraParams?: Record<string, any>
    }>(),
    {
      title: '任务列表',
      type: 'pending',
      extraParams: () => ({})
    }
  )

  defineEmits<{
    showDetail: [id: string]
    retry: [id: string]
  }>()

  const jobs = ref<HorizonJob[]>([])
  const loading = ref(false)
  const total = ref(0)
  const startingAt = ref(-1)
  const hasMore = ref(true)

  function simplifyName(name: string): string {
    if (!name) return '—'
    const parts = name.split('\\')
    return parts[parts.length - 1]
  }

  function formatTime(time: string): string {
    if (!time) return '—'
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

  function statusTagType(status: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' {
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

  function defaultFetchFn(): FetchFn {
    switch (props.type) {
      case 'completed':
        return fetchHorizonCompletedJobs
      case 'failed':
        return fetchHorizonFailedJobs
      case 'silenced':
        return fetchHorizonSilencedJobs
      case 'pending':
      default:
        return fetchHorizonPendingJobs
    }
  }

  async function loadData(reset = false) {
    if (reset) {
      startingAt.value = -1
      jobs.value = []
      hasMore.value = true
    }
    if (!hasMore.value && !reset) return
    loading.value = true
    try {
      const fn = props.fetchFn || defaultFetchFn()
      const params: Record<string, any> = { starting_at: startingAt.value, ...props.extraParams }
      const res = await fn(params)
      if (reset) {
        jobs.value = res.jobs
      } else {
        jobs.value.push(...res.jobs)
      }
      total.value = res.total
      if (res.jobs.length < 50 || jobs.value.length >= res.total) {
        hasMore.value = false
      } else {
        const lastJob = res.jobs[res.jobs.length - 1]
        if (lastJob)
          startingAt.value =
            typeof lastJob.id === 'number' ? lastJob.id : parseInt(String(lastJob.id)) || -1
        else hasMore.value = false
      }
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    await loadData(false)
  }

  async function handleRetry(id: string) {
    await retryHorizonJob(id)
    ElMessage.success('已提交重试')
    loadData(true)
  }

  // 自动轮询（失败任务每10秒刷新，其他类型不自动刷新以免分页混乱）
  let pollTimer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    loadData(true)
    if (props.type === 'failed') {
      pollTimer = setInterval(() => loadData(true), 10000)
    }
  })
  onBeforeUnmount(() => {
    if (pollTimer) clearInterval(pollTimer)
  })

  // 暴露重试方法
  defineExpose({ refresh: () => loadData(true) })
</script>

<style scoped>
  @reference '@/assets/styles/core/tailwind.css';

  .job-header {
    grid-template-columns: minmax(0, 2fr) 120px 100px 1fr;

    @apply gap-x-3 px-3 pb-2 text-xs uppercase font-bold text-g-500;

    border-bottom: 1px solid var(--default-border);
  }

  .job-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) 120px 100px 1fr;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    border-radius: var(--custom-radius-xs);
    transition: background 0.15s;
  }

  .job-row:hover {
    background: var(--art-gray-100);
  }

  .job-row + .job-row {
    margin-top: 2px;
  }

  .job-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-g-800);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (width <= 768px) {
    .job-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .job-main {
      grid-column: 1;
    }

    .job-status {
      grid-row: 1;
      grid-column: 2;
    }

    .job-queue,
    .job-time {
      display: none;
    }
  }
</style>
