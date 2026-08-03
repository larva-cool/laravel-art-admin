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
    (e: 'search', params: Partial<Api.SystemManage.SettingSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.SettingSearchParams>>({})

  const formItems = [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      placeholder: '配置名称/键名',
      clearable: true
    },
    {
      label: '值类型',
      key: 'cast_type',
      type: 'select',
      props: {
        placeholder: '请选择值类型',
        clearable: true,
        options: [
          { label: '字符串', value: 'string' },
          { label: '整型', value: 'int' },
          { label: '浮点型', value: 'float' },
          { label: '布尔型', value: 'bool' },
          { label: 'JSON', value: 'json' }
        ]
      }
    }
  ]

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.SettingSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
