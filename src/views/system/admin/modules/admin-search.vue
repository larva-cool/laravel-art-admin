<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { fetchGetRoleList } from '@/api/system-manage'
  import { computed, onMounted, ref } from 'vue'

  interface Emits {
    (e: 'search', params: Partial<Api.SystemManage.AdminSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})
  const roleOptions = ref<{ label: string; value: string }[]>([])

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      placeholder: '用户名/昵称/邮箱/手机号',
      clearable: true
    },
    {
      label: '角色',
      key: 'role',
      type: 'select',
      props: {
        placeholder: '请选择角色',
        clearable: true,
        options: roleOptions.value
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '正常', value: 1 },
          { label: '禁用', value: 0 }
        ]
      }
    },
    {
      label: '登录IP',
      key: 'last_login_ip',
      type: 'input',
      placeholder: '请输入登录IP',
      clearable: true
    },
    {
      label: '登录时间',
      key: 'last_login_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        placeholder: ['开始日期', '结束日期'],
        clearable: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  onMounted(async () => {
    const res = await fetchGetRoleList({ page: 1, per_page: 100 })
    roleOptions.value = (res?.data || []).map((r) => ({
      label: r.display_name,
      value: r.name
    }))
  })

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Record<string, any>) {
    await searchBarRef.value?.validate()

    // 将日期范围拆分为开始/结束两个参数
    const { last_login_range, ...rest } = params
    const output: Partial<Api.SystemManage.AdminSearchParams> = { ...rest }

    if (last_login_range && Array.isArray(last_login_range) && last_login_range.length === 2) {
      output.last_login_start = last_login_range[0]
      output.last_login_end = last_login_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
