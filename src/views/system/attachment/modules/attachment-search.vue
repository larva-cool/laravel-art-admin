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
      placeholder: '文件名/原始名',
      clearable: true
    },
    {
      label: '文件类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择文件类型',
        clearable: true,
        options: [
          { label: '图片', value: 'image' },
          { label: '视频', value: 'video' },
          { label: '音频', value: 'audio' },
          { label: '文档', value: 'document' },
          { label: '压缩包', value: 'archive' },
          { label: '其他', value: 'other' }
        ]
      }
    },
    {
      label: '存储磁盘',
      key: 'disk',
      type: 'select',
      props: {
        placeholder: '请选择存储磁盘',
        clearable: true,
        options: [
          { label: '本地', value: 'local' },
          { label: '公共', value: 'public' },
          { label: 'S3', value: 's3' }
        ]
      }
    },
    {
      label: '上传开始日期',
      key: 'start_date',
      type: 'date-picker',
      props: {
        type: 'date',
        placeholder: '选择开始日期',
        clearable: true,
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      label: '上传结束日期',
      key: 'end_date',
      type: 'date-picker',
      props: {
        type: 'date',
        placeholder: '选择结束日期',
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

<style scoped lang="scss"></style>
