<template>
  <ElDialog
    v-model="dialogVisible"
    title="操作日志详情"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElDescriptions :column="2" border class="mt-4">
      <ElDescriptionsItem label="ID" :span="1">{{ log?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人" :span="1">
        {{ log?.operator_name || '—' }}
        <span v-if="log?.operator_id" class="text-xs text-g-500">（#{{ log.operator_id }}）</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作描述" :span="2">{{ log?.title || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="请求方法" :span="1">
        <ElTag size="small" :type="methodTagType(log?.method)">{{ log?.method || '—' }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态码" :span="1">
        <ElTag size="small" :type="log?.is_failed ? 'danger' : 'success'">
          {{ log?.status_code ?? '—' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求地址" :span="2">
        <code class="text-sm font-mono">{{ log?.uri || '—' }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="路由名称" :span="1">
        <code class="text-sm font-mono">{{ log?.route || '—' }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="执行耗时" :span="1">
        {{ log?.runtime != null ? `${log.runtime}s` : '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="IP" :span="1">{{ log?.ip || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作时间" :span="1">
        {{ log?.created_at || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="User Agent" :span="2">
        <span class="text-xs break-all">{{ log?.user_agent || '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="请求参数" :span="2">
        <pre
          class="text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap mt-2"
          >{{ payloadText }}</pre>
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="log?.error" label="错误信息" :span="2">
        <pre
          class="text-xs text-danger font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap mt-2"
          >{{ log.error }}</pre>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAuditLogDetail } from '@/api/monitor'
  import { computed, ref } from 'vue'

  defineOptions({ name: 'AuditLogDetailDialog' })

  type AuditLogItem = Api.Monitor.AuditLogItem

  const dialogVisible = ref(false)
  const log = ref<AuditLogItem | null>(null)

  const payloadText = computed(() => {
    const payload = log.value?.payload
    if (!payload || Object.keys(payload).length === 0) {
      return '—'
    }
    return JSON.stringify(payload, null, 2)
  })

  const open = async (row: AuditLogItem) => {
    dialogVisible.value = true
    log.value = row

    try {
      const detail = await fetchAuditLogDetail(row.id)
      log.value = detail
    } catch {
      // 保留列表数据
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    log.value = null
  }

  function methodTagType(method?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    switch (method) {
      case 'POST':
        return 'success'
      case 'PUT':
      case 'PATCH':
        return 'warning'
      case 'DELETE':
        return 'danger'
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
