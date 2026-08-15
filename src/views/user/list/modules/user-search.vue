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
  import { computed, ref } from 'vue'

  interface Emits {
    (e: 'search', params: Partial<Api.UserManage.UserSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      placeholder: '用户名/昵称/邮箱/手机号',
      clearable: true
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
          { label: '冻结', value: 0 }
        ]
      }
    },
    {
      label: 'VIP',
      key: 'vip',
      type: 'select',
      props: {
        placeholder: '请选择VIP状态',
        clearable: true,
        options: [
          { label: 'VIP用户', value: '1' },
          { label: '普通用户', value: '0' }
        ]
      }
    },
    {
      label: '登录时间',
      key: 'login_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        placeholder: ['开始日期', '结束日期'],
        clearable: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      label: '注册时间',
      key: 'register_range',
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

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Record<string, any>) {
    await searchBarRef.value?.validate()

    const { login_range, register_range, ...rest } = params
    const output: Partial<Api.UserManage.UserSearchParams> = { ...rest }

    if (login_range && Array.isArray(login_range) && login_range.length === 2) {
      output.login_start = login_range[0]
      output.login_end = login_range[1]
    }
    if (register_range && Array.isArray(register_range) && register_range.length === 2) {
      output.register_start = register_range[0]
      output.register_end = register_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
