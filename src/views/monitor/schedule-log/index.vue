<template>
  <div class="art-full-height">
    <ScheduleLogSearch
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
      />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ScheduleLogDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { fetchScheduleLogList } from '@/api/monitor'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElTag } from 'element-plus'
  import { h } from 'vue'
  import ScheduleLogDetailDialog from './modules/schedule-log-detail-dialog.vue'
  import ScheduleLogSearch from './modules/schedule-log-search.vue'

  defineOptions({ name: 'ScheduleLog' })

  type ScheduleLogItem = Api.Monitor.ScheduleLogItem

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof ScheduleLogDetailDialog>>()

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
      apiFn: fetchScheduleLogList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 110 },
        { prop: 'name', label: '任务名称', minWidth: 200, showOverflowTooltip: true },
        {
          prop: 'type',
          label: '类型',
          width: 100,
          formatter: (row: ScheduleLogItem) =>
            h(ElTag, { type: typeTagType(row.type), size: 'small' }, () => row.type)
        },
        {
          prop: 'expression',
          label: 'Cron 表达式',
          width: 160,
          showOverflowTooltip: true,
          formatter: (row: ScheduleLogItem) =>
            h('code', { class: 'text-xs font-mono text-g-700' }, row.expression || '—')
        },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: ScheduleLogItem) =>
            h(
              ElTag,
              { type: statusTagType(row.status), size: 'small', effect: 'light' },
              () => row.status_text
            )
        },
        {
          prop: 'runtime',
          label: '耗时',
          width: 100,
          formatter: (row: ScheduleLogItem) => (row.runtime != null ? `${row.runtime}s` : '—')
        },
        {
          prop: 'exit_code',
          label: '退出码',
          width: 80,
          formatter: (row: ScheduleLogItem) => row.exit_code ?? '—'
        },
        { prop: 'hostname', label: '主机名', width: 120, showOverflowTooltip: true },
        { prop: 'started_at', label: '开始时间', width: 180 },
        { prop: 'finished_at', label: '结束时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row: ScheduleLogItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [{ key: 'view', label: '查看', icon: 'ri:eye-line' }],
                onClick: () => handleAction(row)
              })
            ])
        }
      ]
    }
  })

  const handleAction = (row: ScheduleLogItem) => {
    detailDialogRef.value?.open(row)
  }

  const handleSearch = (params: Partial<Api.Monitor.ScheduleLogSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  function statusTagType(status: number): 'success' | 'warning' | 'info' | 'danger' {
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

  function typeTagType(type: string): 'primary' | 'success' | 'info' {
    switch (type) {
      case 'command':
        return 'primary'
      case 'callback':
        return 'success'
      default:
        return 'info'
    }
  }
</script>
