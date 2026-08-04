<template>
  <div class="art-full-height">
    <PhoneCodeSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
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
  </div>
</template>

<script setup lang="ts">
  import { fetchGetPhoneCodeList } from '@/api/system-manage'
  import { useTable } from '@/hooks/core/useTable'
  import { ElTag } from 'element-plus'
  import PhoneCodeSearch from './modules/phone-code-search.vue'

  defineOptions({ name: 'PhoneCode' })

  type PhoneCodeListItem = Api.SystemManage.PhoneCodeListItem

  const showSearchBar = ref(true)

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
      apiFn: fetchGetPhoneCodeList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        { prop: 'phone', label: '手机号', minWidth: 150 },
        { prop: 'scene', label: '场景', minWidth: 120 },
        { prop: 'code', label: '验证码', width: 120 },
        { prop: 'ip', label: 'IP 地址', width: 150 },
        {
          prop: 'state',
          label: '状态',
          width: 100,
          formatter: (row: PhoneCodeListItem) =>
            h(
              ElTag,
              { type: row.state.value === 1 ? 'success' : 'info', size: 'small' },
              () => row.state.label
            )
        },
        { prop: 'send_at', label: '发送时间', width: 180 },
        { prop: 'created_at', label: '创建时间', width: 180 }
      ]
    }
  })

  const handleSearch = (params: Partial<Api.SystemManage.PhoneCodeSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }
</script>
