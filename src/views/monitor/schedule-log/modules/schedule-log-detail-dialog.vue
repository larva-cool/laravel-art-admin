<template>
  <ElDialog
    v-model="dialogVisible"
    title="调度日志详情"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElDescriptions :column="2" border class="mt-4">
      <ElDescriptionsItem label="ID" :span="1">{{ log?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="任务名称" :span="1">{{ log?.name || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="任务类型" :span="1">
        <ElTag size="small" :type="typeTagType(log?.type)">{{ log?.type || '—' }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="执行状态" :span="1">
        <ElTag size="small" :type="statusTagType(log?.status)">{{ log?.status_text || '—' }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="Cron 表达式" :span="1">
        <code class="text-sm font-mono">{{ log?.expression || '—' }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="退出码" :span="1">
        {{ log?.exit_code ?? '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="执行耗时" :span="1">
        {{ log?.runtime != null ? `${log.runtime}s` : '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="主机名" :span="1">
        {{ log?.hostname || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="开始时间" :span="1">
        {{ log?.started_at || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="结束时间" :span="1">
        {{ log?.finished_at || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="log?.exception" label="异常信息" :span="2">
        <pre
          class="text-xs text-danger font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap mt-2"
          >{{ log.exception }}</pre>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { fetchScheduleLogDetail } from '@/api/monitor'

  defineOptions({ name: 'ScheduleLogDetailDialog' })

  type ScheduleLogItem = Api.Monitor.ScheduleLogItem

  const dialogVisible = ref(false)
  const log = ref<ScheduleLogItem | null>(null)

  const open = async (row: ScheduleLogItem) => {
    dialogVisible.value = true
    log.value = row

    try {
      const detail = await fetchScheduleLogDetail(row.id)
      log.value = detail
    } catch {
      // 保留列表数据
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    log.value = null
  }

  function statusTagType(status?: number): 'success' | 'warning' | 'info' | 'danger' {
    switch (status) {
      case 1:
        return 'success'
      case 2:
        return 'danger'
      case 3:
        return 'info'
      default:
        return 'warning'
    }
  }

  function typeTagType(type?: string): 'primary' | 'success' | 'info' {
    switch (type) {
      case 'command':
        return 'primary'
      case 'callback':
        return 'success'
      default:
        return 'info'
    }
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }
</style>
