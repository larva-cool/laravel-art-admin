<template>
  <div class="art-full-height">
    <NotificationSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @reset-search-params="resetSearchParams"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="success" @click="handleMarkAllRead" v-ripple>全部已读</ElButton>
            <ElButton type="danger" @click="handleClearRead" v-ripple>清空已读</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <NotificationDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchClearReadNotifications,
    fetchGetNotificationList,
    fetchMarkNotificationRead
  } from '@/api/notification'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { h } from 'vue'
  import NotificationDetailDialog from './modules/notification-detail-dialog.vue'
  import NotificationSearch from './modules/notification-search.vue'

  defineOptions({ name: 'Notification' })

  type NotificationItem = Api.Notification.NotificationItem

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof NotificationDetailDialog>>()

  const getTypeLabel = (type: string): string => {
    const shortType = type.split('\\').pop() || type
    const map: Record<string, string> = {
      SystemNotification: '系统通知',
      OrderNotification: '订单通知',
      UserNotification: '用户通知'
    }
    return map[shortType] || shortType
  }

  const getNotificationTitle = (item: NotificationItem): string => {
    const data = item.data as Record<string, unknown> | null
    if (!data) return '—'
    const raw =
      (data.title as string) ||
      (data.message as string) ||
      (data.content as string) ||
      (data.body as string) ||
      (data.text as string) ||
      ''
    const content = String(raw)
    return content ? (content.length > 50 ? content.slice(0, 50) + '...' : content) : '—'
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchGetNotificationList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        {
          prop: 'read_at',
          label: '状态',
          width: 90,
          align: 'center',
          formatter: (row: NotificationItem) =>
            h(ElTag, { type: row.read_at ? 'info' : 'warning', size: 'small' }, () =>
              row.read_at ? '已读' : '未读'
            )
        },
        {
          prop: 'type',
          label: '类型',
          width: 140,
          formatter: (row: NotificationItem) =>
            h(ElTag, { type: 'primary', size: 'small' }, () => getTypeLabel(row.type))
        },
        {
          prop: 'content',
          label: '通知内容',
          minWidth: 300,
          showOverflowTooltip: true,
          formatter: (row: NotificationItem) => getNotificationTitle(row)
        },
        { prop: 'send_at', label: '发送时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 180,
          fixed: 'right',
          formatter: (row: NotificationItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  { key: 'view', label: '查看', icon: 'ri:eye-line' },
                  {
                    key: 'read',
                    label: '标记已读',
                    icon: 'ri:check-double-line',
                    disabled: !!row.read_at
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const handleAction = (item: ButtonMoreItem, row: NotificationItem) => {
    switch (item.key) {
      case 'view':
        handleView(row)
        break
      case 'read':
        handleMarkRead(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleView = (row: NotificationItem) => {
    // 查看时自动标记为已读
    if (!row.read_at) {
      fetchMarkNotificationRead(row.id).catch(() => {})
      row.read_at = new Date().toISOString()
    }
    detailDialogRef.value?.open(row)
  }

  const handleSearch = (params: Record<string, unknown>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleMarkRead = async (row: NotificationItem) => {
    await fetchMarkNotificationRead(row.id)
    ElMessage.success('标记已读成功')
    refreshData()
  }

  const handleMarkAllRead = () => {
    ElMessageBox.confirm('确定将所有未读通知标记为已读吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
      .then(async () => {
        const { fetchMarkAllNotificationsRead } = await import('@/api/notification')
        await fetchMarkAllNotificationsRead()
        ElMessage.success('全部标记已读成功')
        refreshData()
      })
      .catch(() => {})
  }

  const handleClearRead = () => {
    ElMessageBox.confirm('确定清空所有已读通知吗？此操作不可恢复。', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchClearReadNotifications()
        ElMessage.success('已清空已读通知')
        refreshData()
      })
      .catch(() => {})
  }

  const handleDelete = (row: Api.Notification.NotificationItem) => {
    void row
    ElMessageBox.confirm('确定删除这条通知吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        // 单条删除：目前后端无单条删除 API，这里提示用户使用清空已读功能
        // 或如果有需求可扩展后端接口
        ElMessage.info('单条删除功能暂未实现')
      })
      .catch(() => {})
  }
</script>
