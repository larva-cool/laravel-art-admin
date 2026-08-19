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
    (e: 'search', params: Partial<Api.Monitor.ScheduleLogSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const formItems = computed(() => [
    {
      label: '任务名称',
      key: 'name',
      type: 'input',
      placeholder: '请输入任务名称',
      clearable: true
    },
    {
      label: '任务类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择类型',
        clearable: true,
        options: [
          { label: 'command', value: 'command' },
          { label: 'callback', value: 'callback' },
          { label: 'exec', value: 'exec' }
        ]
      }
    },
    {
      label: '执行状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '执行中', value: 0 },
          { label: '成功', value: 1 },
          { label: '失败', value: 2 },
          { label: '跳过', value: 3 }
        ]
      }
    },
    {
      label: '执行时间',
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
    const output: Partial<Api.Monitor.ScheduleLogSearchParams> = { ...rest }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.start_date = date_range[0]
      output.end_date = date_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
