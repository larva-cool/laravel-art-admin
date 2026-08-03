<!-- 菜单管理页面 -->
<template>
  <div class="menu-page art-full-height">
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
        v-model:columns="columnChecks"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElButton v-auth="'menus.create'" @click="handleAddMenu" v-ripple> 添加菜单 </ElButton>
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

      <!-- 菜单弹窗 -->
      <MenuDialog ref="dialogRef" @refresh="loadMenuTree" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { fetchDeleteMenu, fetchGetMenuTree } from '@/api/system-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { ElMessageBox, ElTag } from 'element-plus'
  import MenuDialog from './modules/menu-dialog.vue'

  defineOptions({ name: 'Menus' })

  type MenuTreeItem = Api.SystemManage.MenuTreeItem

  // 状态管理
  const loading = ref(false)
  const isExpanded = ref(false)
  const tableRef = ref()

  // 弹窗
  const dialogRef = ref<InstanceType<typeof MenuDialog>>()

  // 搜索相关
  const formFilters = reactive({ name: '', route: '' })
  const appliedFilters = reactive({ name: '', route: '' })

  const formItems = computed(() => [
    {
      label: '菜单名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '路由地址',
      key: 'route',
      type: 'input',
      props: { clearable: true }
    }
  ])

  onMounted(() => {
    loadMenuTree()
  })

  /**
   * 加载菜单树数据
   */
  const loadMenuTree = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchGetMenuTree()) || []
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取菜单类型标签颜色
   */
  const getMenuTypeTag = (
    row: MenuTreeItem
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    if (row.type.value === 2) return 'danger'
    if (row.children?.length) return 'info'
    if (row.link && row.is_iframe) return 'success'
    if (row.path) return 'primary'
    if (row.link) return 'warning'
    return 'info'
  }

  // 表格列配置
  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'title',
      label: '菜单名称',
      minWidth: 120
    },
    {
      prop: 'type',
      label: '菜单类型',
      formatter: (row: MenuTreeItem) => {
        return h(ElTag, { type: getMenuTypeTag(row) }, () => row.type.label)
      }
    },
    {
      prop: 'path',
      label: '路由',
      formatter: (row: MenuTreeItem) => {
        if (row.type.value === 2) return ''
        return row.link || row.path || ''
      }
    },
    {
      prop: 'permission',
      label: '权限标识',
      formatter: (row: MenuTreeItem) => row.permission || ''
    },
    {
      prop: 'icon',
      label: '图标',
      formatter: (row: MenuTreeItem) => row.icon || ''
    },
    {
      prop: 'sort',
      label: '排序'
    },
    {
      prop: 'is_enable',
      label: '状态',
      formatter: (row: MenuTreeItem) =>
        h(ElTag, { type: row.is_enable ? 'success' : 'info' }, () =>
          row.is_enable ? '启用' : '禁用'
        )
    },
    {
      prop: 'updated_at',
      label: '更新时间'
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'right',
      formatter: (row: MenuTreeItem) => {
        return h(ArtButtonMore, {
          list: [
            { key: 'add', label: '新增子菜单', icon: 'ri:add-line', auth: 'menus.create' },
            { key: 'edit', label: '编辑', icon: 'ri:edit-2-line', auth: 'menus.edit' },
            {
              key: 'delete',
              label: '删除',
              icon: 'ri:delete-bin-4-line',
              color: '#f56c6c',
              auth: 'menus.delete'
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

  // 数据相关
  const tableData = ref<MenuTreeItem[]>([])

  /**
   * 搜索过滤
   */
  const filterTree = (items: MenuTreeItem[], name: string, route: string): MenuTreeItem[] => {
    const results: MenuTreeItem[] = []
    for (const item of items) {
      const nameMatch = !name || item.title.toLowerCase().includes(name)
      const routeMatch = !route || (item.path || '').toLowerCase().includes(route)
      const children = item.children?.length ? filterTree(item.children, name, route) : []
      if ((nameMatch && routeMatch) || children.length > 0) {
        results.push({ ...item, children: children.length > 0 ? children : undefined })
      }
    }
    return results
  }

  const filteredTableData = computed(() => {
    const name = appliedFilters.name.toLowerCase().trim()
    const route = appliedFilters.route.toLowerCase().trim()
    if (!name && !route) return tableData.value
    return filterTree(tableData.value, name, route)
  })

  /** 重置搜索 */
  const handleReset = (): void => {
    Object.assign(formFilters, { name: '', route: '' })
    Object.assign(appliedFilters, { name: '', route: '' })
    loadMenuTree()
  }

  /** 执行搜索 */
  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters })
  }

  /** 刷新 */
  const handleRefresh = (): void => {
    loadMenuTree()
  }

  /** 新增顶级菜单 */
  const handleAddMenu = (): void => {
    dialogRef.value?.open(null, tableData.value)
  }

  /** 新增子菜单 */
  const handleAddChild = (row: MenuTreeItem): void => {
    dialogRef.value?.open(null, tableData.value, row.id)
  }

  /** 编辑菜单 */
  const handleEdit = (row: MenuTreeItem): void => {
    dialogRef.value?.open(row, tableData.value)
  }

  /** 删除菜单 */
  const handleDelete = async (row: MenuTreeItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定删除菜单"${row.title}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteMenu(row.id)
      loadMenuTree()
    } catch {
      // 用户取消
    }
  }

  /** 切换展开/收起 */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: MenuTreeItem[]) => {
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
</script>
