<template>
  <div class="area-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      :showExpand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        :showColumnConfig="false"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElButton v-auth="'areas.create'" @click="handleAdd" v-ripple> 新增地区 </ElButton>
          <ElButton @click="toggleExpand" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :columns="columns"
        :data="filteredTableData"
        :stripe="false"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      />

      <!-- 地区弹窗 -->
      <AreaDialog ref="dialogRef" @refresh="loadAreaTree" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { fetchDeleteArea, fetchGetAreaTree } from '@/api/system-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { ElMessageBox } from 'element-plus'
  import AreaDialog from './modules/area-dialog.vue'

  defineOptions({ name: 'SystemArea' })

  type AreaListItem = Api.SystemManage.AreaListItem

  // 状态管理
  const loading = ref(false)
  const isExpanded = ref(false)
  const tableRef = ref()

  // 弹窗
  const dialogRef = ref<InstanceType<typeof AreaDialog>>()

  // 搜索相关
  const formFilters = reactive({ name: '' })
  const appliedFilters = reactive({ name: '' })

  const formItems = [
    {
      label: '地区名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    }
  ]

  // 数据
  const tableData = ref<AreaListItem[]>([])

  // 表格列配置
  const { columns } = useTableColumns<AreaListItem>(() => [
    { prop: 'id', label: 'ID', width: 110 },
    { prop: 'name', label: '地区名称', minWidth: 150 },
    { prop: 'area_code', label: '区域编码', width: 120 },
    { prop: 'city_code', label: '区号', width: 100 },
    { prop: 'lat', label: '纬度', width: 120 },
    { prop: 'lng', label: '经度', width: 120 },
    { prop: 'sort', label: '排序', width: 80 },
    { prop: 'updated_at', label: '更新时间', width: 180 },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'right',
      formatter: (row: AreaListItem) => {
        return h(ArtButtonMore, {
          list: [
            { key: 'add', label: '新增子级', icon: 'ri:add-line', auth: 'areas.create' },
            { key: 'edit', label: '编辑', icon: 'ri:edit-2-line', auth: 'areas.edit' },
            {
              key: 'delete',
              label: '删除',
              icon: 'ri:delete-bin-4-line',
              color: '#f56c6c',
              auth: 'areas.delete'
            }
          ],
          onClick: (item: ButtonMoreItem) => {
            if (item.key === 'add') handleAddChild(row)
            else if (item.key === 'edit') handleEdit(row)
            else if (item.key === 'delete') handleDelete(row)
          }
        })
      }
    }
  ])

  /**
   * 加载地区树数据
   */
  const loadAreaTree = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchGetAreaTree()) || []
    } finally {
      loading.value = false
    }
  }

  /**
   * 深度搜索过滤
   */
  const filterTree = (items: AreaListItem[], keyword: string): AreaListItem[] => {
    const results: AreaListItem[] = []
    for (const item of items) {
      const matched = item.name.toLowerCase().includes(keyword.toLowerCase())
      const children = item.children?.length ? filterTree(item.children, keyword) : []
      if (matched || children.length > 0) {
        results.push({ ...item, children: children.length > 0 ? children : undefined })
      }
    }
    return results
  }

  /** 过滤后的表格数据 */
  const filteredTableData = computed(() => {
    const keyword = appliedFilters.name.trim()
    if (!keyword) return tableData.value
    return filterTree(tableData.value, keyword)
  })

  /** 搜索 */
  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters })
  }

  /** 重置搜索 */
  const handleReset = (): void => {
    Object.assign(formFilters, { name: '' })
    Object.assign(appliedFilters, { name: '' })
    loadAreaTree()
  }

  /** 刷新 */
  const handleRefresh = (): void => {
    loadAreaTree()
  }

  /** 新增顶级地区 */
  const handleAdd = (): void => {
    dialogRef.value?.open(null, tableData.value)
  }

  /** 新增子级地区 */
  const handleAddChild = (row: AreaListItem): void => {
    dialogRef.value?.open(null, tableData.value, row.id)
  }

  /** 编辑地区 */
  const handleEdit = (row: AreaListItem): void => {
    dialogRef.value?.open(row, tableData.value)
  }

  /** 删除地区 */
  const handleDelete = async (row: AreaListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定删除地区"${row.name}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteArea(row.id)
      loadAreaTree()
    } catch {
      // 用户取消
    }
  }

  /** 切换展开/收起 */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: AreaListItem[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(filteredTableData.value)
      }
    })
  }

  onMounted(() => {
    loadAreaTree()
  })
</script>
