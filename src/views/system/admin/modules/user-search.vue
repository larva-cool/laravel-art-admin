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
  import { fetchGetRoleList } from '@/api/system-manage'
  import { computed, onMounted, ref } from 'vue'

  interface Emits {
    (e: 'search', params: Partial<Api.SystemManage.AdminSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.AdminSearchParams>>({})
  const roleOptions = ref<{ label: string; value: string }[]>([])

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      placeholder: '用户名/昵称/邮箱/手机号',
      clearable: true
    },
    {
      label: '角色',
      key: 'role',
      type: 'select',
      props: {
        placeholder: '请选择角色',
        clearable: true,
        options: roleOptions.value
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '正常', value: 1 },
          { label: '禁用', value: 0 }
        ]
      }
    }
  ])

  onMounted(async () => {
    const res = await fetchGetRoleList({ page: 1, per_page: 100 })
    roleOptions.value = (res?.data || []).map((r) => ({
      label: r.display_name,
      value: r.name
    }))
  })

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
