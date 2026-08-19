<template>
  <div v-loading="loading" class="art-card h-105 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>登录趋势</h4>
        <p class="text-g-600">近 7 天每日登录次数</p>
      </div>
    </div>
    <ArtLineChart
      height="calc(100% - 56px)"
      :data="data"
      :xAxisData="xAxisData"
      :showAreaColor="true"
      :showAxisLine="false"
    />
  </div>
</template>

<script setup lang="ts">
  import { fetchDashboardStats, type DashboardStatsResponse } from '@/api/dashboard'

  const loading = ref(true)
  const data = ref<number[]>([])
  const xAxisData = ref<string[]>([])

  async function loadData() {
    loading.value = true
    try {
      const res: DashboardStatsResponse = await fetchDashboardStats({ days: 7 })
      const trend = res.login_trend

      xAxisData.value = trend.map((p) => {
        const d = new Date(p.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      })
      data.value = trend.map((p) => p.count)
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)
</script>
