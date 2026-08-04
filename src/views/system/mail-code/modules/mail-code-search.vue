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
    (e: 'search', params: Partial<Api.SystemManage.MailCodeSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.MailCodeSearchParams>>({})

  const formItems = [
    {
      label: '邮箱',
      key: 'email',
      type: 'input',
      placeholder: '请输入邮箱',
      clearable: true
    },
    {
      label: '状态',
      key: 'state',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '未使用', value: 0 },
          { label: '已使用', value: 1 }
        ]
      }
    }
  ]

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.MailCodeSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
