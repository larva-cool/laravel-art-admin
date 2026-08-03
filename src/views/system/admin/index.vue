<template>
  <div class="art-full-height">
    <UserSearch
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
            <ElButton type="primary" @click="editDialogRef?.open()" v-ripple>新增管理员</ElButton>
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

    <AdminEditDialog ref="editDialogRef" @refresh="refreshCreate" />
  </div>
</template>

<script setup lang="ts">
  import { fetchDeleteAdmin, fetchGetAdminList, fetchToggleAdminStatus } from '@/api/system-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElTag } from 'element-plus'
  import AdminEditDialog from './modules/user-dialog.vue'
  import UserSearch from './modules/user-search.vue'

  defineOptions({ name: 'Admin' })

  type AdminListItem = Api.SystemManage.AdminListItem

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof AdminEditDialog>>()

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
      apiFn: fetchGetAdminList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 110 },
        { prop: 'username', label: '用户名', minWidth: 120 },
        { prop: 'name', label: '昵称', minWidth: 120 },
        { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true },
        { prop: 'phone', label: '手机号', width: 140 },
        {
          prop: 'roles',
          label: '角色',
          minWidth: 120,
          formatter: (row: AdminListItem) => {
            const roles = row.roles || []
            if (roles.length === 0) return '—'
            return h(
              'div',
              { style: 'display: flex; gap: 4px; flex-wrap: wrap' },
              roles.map((r) => h(ElTag, { type: 'info', size: 'small' }, () => r))
            )
          }
        },
        {
          prop: 'status',
          label: '状态',
          width: 80,
          formatter: (row: AdminListItem) =>
            h(
              ElTag,
              { type: row.status.value === 1 ? 'success' : 'danger' },
              () => row.status.label
            )
        },
        { prop: 'login_count', label: '登录次数', width: 100 },
        { prop: 'last_login_at', label: '最后登录', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row: AdminListItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  { key: 'edit', label: '编辑', icon: 'ri:edit-2-line' },
                  {
                    key: 'toggle',
                    label: row.status.value === 1 ? '禁用' : '启用',
                    icon: row.status.value === 1 ? 'ri:forbid-line' : 'ri:checkbox-circle-line'
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

  const handleAction = (item: ButtonMoreItem, row: AdminListItem) => {
    switch (item.key) {
      case 'edit':
        editDialogRef.value?.open(row)
        break
      case 'toggle':
        handleToggleStatus(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleSearch = (params: Partial<Api.SystemManage.AdminSearchParams>) => {
    Object.assign(searchParams, params)
    getData()
  }

  const handleToggleStatus = async (row: AdminListItem) => {
    await fetchToggleAdminStatus(row.id)
    refreshData()
  }

  const handleDelete = (row: AdminListItem) => {
    ElMessageBox.confirm(`确定删除管理员"${row.username}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteAdmin(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }
</script>
