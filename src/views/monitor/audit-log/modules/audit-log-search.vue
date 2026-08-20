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
    (e: 'search', params: Partial<Api.Monitor.AuditLogSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const formItems = computed(() => [
    {
      label: '操作人',
      key: 'operator_name',
      type: 'input',
      placeholder: '请输入操作人名称',
      clearable: true
    },
    {
      label: '操作描述',
      key: 'route',
      type: 'input',
      placeholder: '请输入路由名称',
      clearable: true
    },
    {
      label: '请求地址',
      key: 'uri',
      type: 'input',
      placeholder: '请输入请求地址',
      clearable: true
    },
    {
      label: '请求方法',
      key: 'method',
      type: 'select',
      props: {
        placeholder: '请选择请求方法',
        clearable: true,
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      }
    },
    {
      label: '执行结果',
      key: 'is_failed',
      type: 'select',
      props: {
        placeholder: '请选择执行结果',
        clearable: true,
        options: [
          { label: '成功', value: false },
          { label: '失败', value: true }
        ]
      }
    },
    {
      label: '状态码',
      key: 'status_code',
      type: 'number',
      props: {
        placeholder: '请输入状态码',
        min: 100,
        max: 599,
        controls: false
      }
    },
    {
      label: '操作时间',
      key: 'date_range',
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

    const { date_range, ...rest } = params
    const output: Partial<Api.Monitor.AuditLogSearchParams> = { ...rest }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.start_date = date_range[0]
      output.end_date = date_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
