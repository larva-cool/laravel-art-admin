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
    (e: 'search', params: Partial<Api.SystemManage.AdminSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.AdminSearchParams>>({})

  const formItems = [
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
        options: [
          { label: '正常', value: 1 },
          { label: '禁用', value: 0 }
        ]
      }
    }
  ]

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.AdminSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
