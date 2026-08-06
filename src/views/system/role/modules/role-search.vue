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
    (e: 'search', params: Partial<Api.SystemManage.RoleSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.RoleSearchParams>>({})

  const formItems = [
    {
      label: '角色Code',
      key: 'role_name',
      type: 'input',
      placeholder: '请输入角色Code',
      clearable: true
    }
  ]

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.RoleSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
