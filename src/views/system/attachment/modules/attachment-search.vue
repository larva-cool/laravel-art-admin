<template>
  <div
    class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.2fr)_repeat(3,minmax(0,0.72fr))_auto]"
  >
    <ElInput
      v-model="formData.keyword"
      clearable
      placeholder="搜索文件名、显示名、对象 Key"
      class="min-w-0 md:col-span-2 xl:col-span-1"
      @keyup.enter="handleSubmit"
    />
    <ElSelect v-model="formData.type" clearable placeholder="文件类型" class="min-w-0">
      <ElOption v-for="opt in typeOptions" :key="opt.value" v-bind="opt" />
    </ElSelect>
    <ElSelect v-model="formData.disk" clearable placeholder="存储" class="min-w-0">
      <ElOption v-for="opt in diskOptions" :key="opt.value" v-bind="opt" />
    </ElSelect>
    <ElSelect v-model="formData.status" clearable placeholder="状态" class="min-w-0">
      <ElOption v-for="opt in statusOptions" :key="opt.value" v-bind="opt" />
    </ElSelect>
    <div class="flex items-center gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton type="primary" @click="handleSubmit" v-ripple>查询</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AttachmentSearch' })

  interface Emits {
    (e: 'search', params: Partial<Api.SystemManage.AttachmentSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  interface FormData {
    keyword?: string
    type?: string
    disk?: string
    status?: string
    date_range?: [string, string] | null
  }

  const formData = reactive<FormData>({
    keyword: '',
    type: undefined,
    disk: undefined,
    status: undefined,
    date_range: null
  })

  const typeOptions = [
    { label: '图片', value: 'image' },
    { label: '视频', value: 'video' },
    { label: '音频', value: 'audio' },
    { label: '文档', value: 'document' },
    { label: '其他', value: 'other' }
  ]

  const diskOptions = [
    { label: '本地存储', value: 'local' },
    { label: '本地公开', value: 'public' },
    { label: '阿里云 OSS', value: 'oss' },
    { label: '腾讯云 COS', value: 'cos' },
    { label: '七牛云', value: 'qiniu' },
    { label: 'S3', value: 's3' }
  ]

  const statusOptions = [
    { label: '存在', value: 'exists' },
    { label: '已丢失', value: 'missing' }
  ]

  function handleReset() {
    Object.assign(formData, {
      keyword: '',
      type: undefined,
      disk: undefined,
      status: undefined,
      date_range: null
    })
    emit('resetSearchParams')
  }

  function handleSubmit() {
    const { date_range: dateRange, status, ...rest } = formData
    const [startDate, endDate] = Array.isArray(dateRange) ? dateRange : []

    const params: Record<string, unknown> = {
      ...rest,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {})
    }

    if (status) params.status = status

    emit('search', params as Partial<Api.SystemManage.AttachmentSearchParams>)
  }
</script>
