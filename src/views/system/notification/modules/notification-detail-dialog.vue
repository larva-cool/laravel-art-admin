<template>
  <ElDialog
    v-model="visible"
    title="通知详情"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElDescriptions v-if="notification" :column="1" border>
      <ElDescriptionsItem label="通知 ID">
        {{ notification.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="通知类型">
        <ElTag type="info">{{ getTypeLabel(notification.type) }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态">
        <ElTag :type="notification.read_at ? 'success' : 'warning'">
          {{ notification.read_at ? '已读' : '未读' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发送时间">
        {{ notification.send_at }}
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="notification.read_at" label="已读时间">
        {{ notification.read_at }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="通知内容">
        <div class="notification-content">
          {{ getNotificationContent(notification) }}
        </div>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton @click="visible = false" v-ripple>关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { ElDescriptions, ElDescriptionsItem, ElDialog, ElTag } from 'element-plus'

  defineOptions({ name: 'NotificationDetailDialog' })

  type NotificationItem = Api.Notification.NotificationItem

  const visible = ref(false)
  const notification = ref<NotificationItem | null>(null)

  const getTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      system: '系统通知',
      order: '订单通知',
      user: '用户通知'
    }
    const shortType = type.split('.').pop() || type
    return map[shortType] || type
  }

  const getNotificationContent = (item: NotificationItem): string => {
    const data = item.data as Record<string, unknown> | null
    if (!data) return ''
    if (typeof data === 'string') return data
    const raw =
      data.title ||
      data.message ||
      data.content ||
      data.body ||
      data.text ||
      JSON.stringify(data, null, 2)
    return String(raw)
  }

  const open = (row: NotificationItem) => {
    notification.value = row
    visible.value = true
  }

  defineExpose({ open })
</script>

<style scoped>
  .notification-content {
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }
</style>
