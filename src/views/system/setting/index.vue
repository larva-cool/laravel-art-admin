<template>
  <div class="art-full-height">
    <SettingSearch
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
            <ElButton
              type="primary"
              v-auth="'settings.create'"
              @click="editDialogRef?.open()"
              v-ripple
              >新增配置</ElButton
            >
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

    <SettingEditDialog ref="editDialogRef" @refresh="refreshCreate" />
  </div>
</template>

<script setup lang="ts">
  import { fetchDeleteSetting, fetchGetSettingList } from '@/api/system-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElTag } from 'element-plus'
  import SettingEditDialog from './modules/setting-edit-dialog.vue'
  import SettingSearch from './modules/setting-search.vue'

  defineOptions({ name: 'Setting' })

  type SettingListItem = Api.SystemManage.SettingListItem

  /** 值类型标签颜色映射 */
  const castTypeTagType: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    string: 'info',
    int: 'primary',
    float: 'primary',
    bool: 'success',
    json: 'warning'
  }

  /** 值类型显示文本映射 */
  const castTypeLabel: Record<string, string> = {
    string: '字符串',
    int: '整型',
    float: '浮点型',
    bool: '布尔型',
    json: 'JSON'
  }

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof SettingEditDialog>>()

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
    refreshData,
    refreshCreate
  } = useTable({
    core: {
      apiFn: fetchGetSettingList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 110 },
        { prop: 'name', label: '配置名称', minWidth: 150 },
        { prop: 'key', label: '配置键名', minWidth: 180 },
        {
          prop: 'value',
          label: '配置值',
          minWidth: 200,
          formatter: (row: SettingListItem) => {
            const val = row.value ?? ''
            return val.length > 50 ? val.slice(0, 50) + '...' : val
          }
        },
        {
          prop: 'cast_type',
          label: '值类型',
          width: 100,
          formatter: (row: SettingListItem) =>
            h(
              ElTag,
              { type: castTypeTagType[row.cast_type] || 'info', size: 'small' },
              () => castTypeLabel[row.cast_type] || row.cast_type
            )
        },
        { prop: 'sort', label: '排序', width: 80 },
        { prop: 'remark', label: '备注', minWidth: 150 },
        { prop: 'updated_at', label: '更新时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row: SettingListItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  { key: 'edit', label: '编辑', icon: 'ri:edit-2-line', auth: 'settings.edit' },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c',
                    auth: 'settings.delete'
                  }
                ],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const handleAction = (item: ButtonMoreItem, row: SettingListItem) => {
    switch (item.key) {
      case 'edit':
        editDialogRef.value?.open(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleSearch = (params: Partial<Api.SystemManage.SettingSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleDelete = (row: SettingListItem) => {
    ElMessageBox.confirm(`确定删除配置"${row.name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteSetting(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }
</script>
