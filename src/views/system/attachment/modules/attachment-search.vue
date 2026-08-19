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
  const formData = ref<Partial<Api.SystemManage.AttachmentSearchParams>>({})

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
      label: '存储位置',
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
      label: '上传开始日期',
      key: 'start_date',
      type: 'date',
      props: {
        placeholder: '开始日期',
        clearable: true,
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      label: '上传结束日期',
      key: 'end_date',
      type: 'date',
      props: {
        placeholder: '结束日期',
        clearable: true,
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ]

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.AttachmentSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>
