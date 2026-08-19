<template>
  <div v-loading="loading" class="art-card h-105 p-4 box-border mb-5 max-sm:mb-4">
    <ArtBarChart
      class="box-border p-2"
      barWidth="50%"
      height="13.7rem"
      :showAxisLine="false"
      :data="chartData"
      :xAxisData="xAxisLabels"
    />
    <div class="ml-1">
      <h3 class="mt-5 text-lg font-medium">用户概述</h3>
      <p class="mt-1 text-sm text-g-600">近 7 天用户增长趋势</p>
    </div>
    <div class="flex-b mt-2">
      <div class="flex-1" v-for="(item, index) in list" :key="index">
        <p class="text-2xl text-g-900 tabular-nums">{{ item.num }}</p>
        <p class="text-xs text-g-500">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchDashboardStats, type DashboardStatsResponse } from '@/api/dashboard'

  interface UserStatItem {
    name: string
    num: string
  }

  const loading = ref(true)
  const xAxisLabels = ref<string[]>([])
  const chartData = ref<number[]>([])
  const list = ref<UserStatItem[]>([])

  async function loadData() {
    loading.value = true
    try {
      const res: DashboardStatsResponse = await fetchDashboardStats({ days: 7 })
      const trend = res.user_trend

      xAxisLabels.value = trend.map((p) => {
        const d = new Date(p.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      })
      chartData.value = trend.map((p) => p.new)

      const cards = res.cards
      list.value = [
        { name: '总用户量', num: formatNum(cards.total_users) },
        { name: '今日新增', num: String(cards.today_new_users) },
        { name: '今日活跃', num: String(cards.today_active_users) },
        { name: '管理员', num: String(cards.total_admins) }
      ]
    } finally {
      loading.value = false
    }
  }

  function formatNum(n: number): string {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  onMounted(loadData)
</script>
