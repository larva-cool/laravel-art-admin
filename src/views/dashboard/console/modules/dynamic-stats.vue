<template>
  <div v-loading="loading" class="art-card h-128 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>最近登录</h4>
        <p>最新 {{ list.length }} 条登录记录</p>
      </div>
    </div>

    <div class="h-9/10 mt-2 overflow-hidden">
      <ElScrollbar>
        <ElEmpty v-if="!list.length && !loading" description="暂无登录记录" :image-size="60" />
        <div
          v-for="(item, index) in list"
          :key="index"
          class="flex-cb h-17.5 border-b border-g-300 text-sm overflow-hidden last:border-b-0"
        >
          <div class="min-w-0">
            <span class="text-g-800 font-medium"
              >{{ item.guard === 'Admin' ? '管理员' : '用户' }}#{{ item.user_id }}</span
            >
            <span class="mx-2 text-g-600">登录于</span>
            <span class="text-theme">{{ item.ip }}</span>
          </div>
          <span class="text-xs text-g-500 shrink-0 ml-2">{{ formatTime(item.login_at) }}</span>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchDashboardStats, type RecentLoginItem } from '@/api/dashboard'

  const loading = ref(true)
  const list = ref<RecentLoginItem[]>([])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchDashboardStats({ days: 7 })
      list.value = res.recent_logins
    } finally {
      loading.value = false
    }
  }

  function formatTime(time: string | null): string {
    if (!time) return '—'
    const d = new Date(time)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return `${diff}秒前`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  onMounted(loadData)
</script>
