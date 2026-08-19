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
  defineOptions({ name: 'AttachmentSearch' })

  interface Emits {
    (e: 'search', params: Partial<Api.SystemManage.AttachmentSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, unknown>>({})

  const formItems = [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '搜索文件名、显示名、对象 Key',
        clearable: true
      }
    },
    {
      label: '文件类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '全部类型',
        clearable: true,
        options: [
          { label: '图片', value: 'image' },
          { label: '视频', value: 'video' },
          { label: '音频', value: 'audio' },
          { label: '文档', value: 'document' },
          { label: '其他', value: 'other' }
        ]
      }
    },
    {
      label: '云厂商',
      key: 'disk',
      type: 'select',
      props: {
        placeholder: '全部存储',
        clearable: true,
        options: [
          { label: '本地私有', value: 'local' },
          { label: '本地公开', value: 'public' },
          { label: 'S3 云存储', value: 's3' }
        ]
      }
    },
    {
      label: '扩展名',
      key: 'extension',
      type: 'input',
      props: {
        placeholder: '如 webp、pdf',
        clearable: true
      }
    },
    {
      label: '上传日期',
      key: 'date_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true,
        valueFormat: 'YYYY-MM-DD',
        unlinkPanels: true
      }
    }
  ]

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Record<string, unknown>) {
    await searchBarRef.value?.validate()

    /** 日期区间拆分为后端要求的 start_date / end_date */
    const { date_range: dateRange, ...rest } = params
    const [startDate, endDate] = Array.isArray(dateRange) ? dateRange : []

    emit('search', {
      ...rest,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {})
    } as Partial<Api.SystemManage.AttachmentSearchParams>)
  }
</script>
