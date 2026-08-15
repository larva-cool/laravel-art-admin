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
    (e: 'search', params: Record<string, unknown>): void
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
      placeholder: '请输入通知内容关键词',
      clearable: true
    },
    {
      label: '类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '全部类型',
        clearable: true,
        options: [
          { label: '系统通知', value: 'system' },
          { label: '订单通知', value: 'order' },
          { label: '用户通知', value: 'user' }
        ]
      }
    },
    {
      label: '状态',
      key: 'read_status',
      type: 'select',
      props: {
        placeholder: '全部状态',
        clearable: true,
        options: [
          { label: '未读', value: 'unread' },
          { label: '已读', value: 'read' }
        ]
      }
    },
    {
      label: '发送时间',
      key: 'time_range',
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

    const { time_range, ...rest } = params
    const output: Record<string, unknown> = { ...rest }

    if (time_range && Array.isArray(time_range) && time_range.length === 2) {
      output.start_time = time_range[0]
      output.end_time = time_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
