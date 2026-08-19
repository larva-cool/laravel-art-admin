<template>
  <div v-loading="loading" class="art-card p-5 h-128 overflow-hidden mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>新用户</h4>
        <p>最近注册的 {{ tableData.length }} 位用户</p>
      </div>
    </div>
    <ArtTable
      class="w-full"
      :data="tableData"
      style="width: 100%"
      size="large"
      :border="false"
      :stripe="false"
      :showPagination="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <ElTableColumn label="用户" prop="username" min-width="180">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <ElAvatar :size="36" :src="scope.row.avatar || undefined">
                {{ scope.row.username?.charAt(0)?.toUpperCase() || '?' }}
              </ElAvatar>
              <span class="ml-2">{{ scope.row.username }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="注册时间" prop="created_at" min-width="180">
          <template #default="scope">
            {{ scope.row.created_at || '—' }}
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { fetchDashboardStats, type NewUserItem } from '@/api/dashboard'

  const loading = ref(true)
  const tableData = ref<NewUserItem[]>([])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchDashboardStats({ days: 7 })
      tableData.value = res.new_users
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)
</script>

<style lang="scss" scoped></style>
