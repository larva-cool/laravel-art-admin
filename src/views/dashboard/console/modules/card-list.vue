<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
      <div
        v-loading="loading"
        class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4"
      >
        <span class="text-g-700 text-sm">{{ item.des }}</span>
        <ArtCountTo class="text-[26px] font-medium mt-2" :target="item.num" :duration="1300" />
        <div class="flex-c mt-1">
          <span class="text-xs text-g-600">较上周</span>
          <span
            class="ml-1 text-xs font-semibold"
            :class="item.change < 0 ? 'text-danger' : 'text-success'"
          >
            {{ item.change >= 0 ? '+' : '' }}{{ item.change }}%
          </span>
        </div>
        <div
          class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
        >
          <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import { fetchDashboardStats, type DashboardCards } from '@/api/dashboard'

  interface CardDataItem {
    des: string
    icon: string
    num: number
    change: number
  }

  const loading = ref(true)
  const dataList = reactive<CardDataItem[]>([
    { des: '总用户数', icon: 'ri:group-line', num: 0, change: 0 },
    { des: '今日新增', icon: 'ri:user-add-line', num: 0, change: 0 },
    { des: '今日活跃', icon: 'ri:pulse-line', num: 0, change: 0 },
    { des: '今日登录', icon: 'ri:login-circle-line', num: 0, change: 0 }
  ])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchDashboardStats({ days: 7 })
      const c: DashboardCards = res.cards
      dataList[0].num = c.total_users
      dataList[0].change = c.new_users_change
      dataList[1].num = c.today_new_users
      dataList[1].change = c.new_users_change
      dataList[2].num = c.today_active_users
      dataList[2].change = c.new_users_change
      dataList[3].num = c.today_logins
      dataList[3].change = c.new_users_change
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)
</script>
