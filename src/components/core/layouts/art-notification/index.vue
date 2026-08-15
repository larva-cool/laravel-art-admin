<!-- 通知组件 -->
<template>
  <div
    class="art-notification-panel art-card-sm !shadow-xl"
    :style="{
      transform: show ? 'scaleY(1)' : 'scaleY(0.9)',
      opacity: show ? 1 : 0
    }"
    v-show="visible"
    @click.stop
  >
    <div class="flex-cb px-3.5 mt-3.5">
      <span class="text-base font-medium text-g-800">{{ $t('notice.title') }}</span>
      <span
        class="text-xs text-g-800 px-1.5 py-1 c-p select-none rounded hover:bg-g-200"
        @click="handleMarkAllRead"
        >{{ $t('notice.btnRead') }}</span
      >
    </div>

    <ul class="box-border flex items-end w-full h-12.5 px-3.5 border-b-d">
      <li
        v-for="(item, index) in barList"
        :key="index"
        class="h-12 leading-12 mr-5 overflow-hidden text-[13px] text-g-700 c-p select-none"
        :class="{ 'bar-active': barActiveIndex === index }"
        @click="changeBar(index)"
      >
        {{ item.name }} ({{ item.num }})
      </li>
    </ul>

    <div class="w-full h-[calc(100%-95px)]">
      <div class="h-[calc(100%-60px)] overflow-y-scroll scrollbar-thin">
        <!-- 通知列表 -->
        <ul v-show="barActiveIndex === 0">
          <li
            v-for="item in noticeList"
            :key="item.id"
            class="box-border flex-c px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
            @click="handleNotificationClick(item)"
          >
            <div
              class="size-9 leading-9 text-center rounded-lg flex-cc"
              :class="getNoticeStyle(item.type).iconClass"
            >
              <ArtSvgIcon class="text-lg !bg-transparent" :icon="getNoticeStyle(item.type).icon" />
            </div>
            <div class="w-[calc(100%-45px)] ml-3.5">
              <h4 class="text-sm font-normal leading-5.5 text-g-900 line-clamp-1">
                {{ getNotificationTitle(item) }}
              </h4>
              <p class="mt-1.5 text-xs text-g-500">{{ formatTime(item.send_at) }}</p>
            </div>
            <div
              v-if="!item.read_at"
              class="ml-2 size-2 !bg-danger rounded-full flex-shrink-0"
            ></div>
          </li>
        </ul>

        <!-- 待办列表（占位，后续可扩展） -->
        <ul v-show="barActiveIndex === 1">
          <li
            v-for="(item, index) in pendingList"
            :key="index"
            class="box-border px-5 py-3.5 last:border-b-0"
          >
            <h4>{{ item.title }}</h4>
            <p class="text-xs text-g-500">{{ item.time }}</p>
          </li>
        </ul>

        <!-- 加载中 -->
        <div v-show="loading" class="relative top-25 h-full text-g-500 text-center !bg-transparent">
          <p class="text-xs !bg-transparent">加载中...</p>
        </div>

        <!-- 空状态 -->
        <div
          v-show="!loading && currentTabIsEmpty"
          class="relative top-25 h-full text-g-500 text-center !bg-transparent"
        >
          <ArtSvgIcon icon="system-uicons:inbox" class="text-5xl" />
          <p class="mt-3.5 text-xs !bg-transparent"> 暂无{{ barList[barActiveIndex].name }} </p>
        </div>
      </div>

      <div class="relative box-border w-full px-3.5">
        <ElButton class="w-full mt-3" @click="handleViewAll" v-ripple>
          {{ $t('notice.viewAll') }}
        </ElButton>
      </div>
    </div>

    <div class="h-25"></div>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchGetUnreadNotifications,
    fetchMarkAllNotificationsRead,
    fetchMarkNotificationRead
  } from '@/api/notification'
  import { ElMessage } from 'element-plus'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  // 导入头像图片

  defineOptions({ name: 'ArtNotification' })

  type NoticeItem = Api.Notification.NotificationItem

  interface PendingItem {
    /** 标题 */
    title: string
    /** 时间 */
    time: string
  }

  interface BarItem {
    /** 名称 */
    name: string
    /** 数量 */
    num: number
  }

  interface NoticeStyle {
    /** 图标 */
    icon: string
    /** icon 样式 */
    iconClass: string
  }

  const router = useRouter()

  const props = defineProps<{
    value: boolean
  }>()

  const emit = defineEmits<{
    'update:value': [value: boolean]
  }>()

  const show = ref(false)
  const visible = ref(false)
  const barActiveIndex = ref(0)
  const loading = ref(false)
  const noticeList = ref<NoticeItem[]>([])

  // 待办数据（mock，后续可扩展）
  const pendingList = ref<PendingItem[]>([])

  const barList = computed<BarItem[]>(() => [
    { name: '通知', num: noticeList.value.length },
    { name: '待办', num: pendingList.value.length }
  ])

  // 获取通知类型对应的图标和样式
  const getNoticeStyle = (type: string): NoticeStyle => {
    const shortType = type.split('\\').pop() || type
    const styleMap: Record<string, NoticeStyle> = {
      SystemNotification: { icon: 'ri:notification-3-line', iconClass: 'bg-theme/12 text-theme' },
      OrderNotification: { icon: 'ri:shopping-cart-line', iconClass: 'bg-success/12 text-success' },
      UserNotification: { icon: 'ri:user-line', iconClass: 'bg-info/12 text-info' }
    }
    return (
      styleMap[shortType] || { icon: 'ri:notification-3-line', iconClass: 'bg-theme/12 text-theme' }
    )
  }

  // 获取通知标题
  const getNotificationTitle = (item: NoticeItem): string => {
    const data = item.data as Record<string, unknown> | null
    if (!data) return '新通知'
    const raw =
      (data.title as string) ||
      (data.message as string) ||
      (data.content as string) ||
      (data.body as string) ||
      (data.text as string) ||
      ''
    const content = String(raw)
    return content || '新通知'
  }

  // 格式化时间
  const formatTime = (time: string): string => {
    if (!time) return ''
    const now = new Date()
    const date = new Date(time)
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return time.slice(0, 10)
  }

  // 加载未读通知
  const loadUnreadNotifications = async () => {
    loading.value = true
    try {
      const res = await fetchGetUnreadNotifications({ page: 1, per_page: 20 })
      noticeList.value = res?.data || []
    } catch (err) {
      console.error('加载通知失败', err)
    } finally {
      loading.value = false
    }
  }

  // 切换标签
  const changeBar = (index: number) => {
    barActiveIndex.value = index
  }

  // 检查当前标签页是否为空
  const currentTabIsEmpty = computed(() => {
    const tabDataMap = [noticeList.value, pendingList.value]
    const currentData = tabDataMap[barActiveIndex.value]
    return currentData && currentData.length === 0
  })

  // 点击通知
  const handleNotificationClick = async (item: NoticeItem) => {
    if (!item.read_at) {
      try {
        await fetchMarkNotificationRead(item.id)
        item.read_at = new Date().toISOString()
      } catch (err) {
        console.error('标记已读失败', err)
      }
    }
    // 跳转到通知管理页面
    router.push('/system/notification')
    emit('update:value', false)
  }

  // 全部标记已读
  const handleMarkAllRead = async () => {
    try {
      await fetchMarkAllNotificationsRead()
      ElMessage.success('全部标记为已读')
      noticeList.value = []
    } catch (err) {
      console.error('全部标记已读失败', err)
    }
  }

  // 查看全部
  const handleViewAll = () => {
    router.push('/system/notification')
    emit('update:value', false)
  }

  // 动画管理
  const showNotice = (open: boolean) => {
    if (open) {
      visible.value = true
      loadUnreadNotifications()
      setTimeout(() => {
        show.value = true
      }, 5)
    } else {
      show.value = false
      setTimeout(() => {
        visible.value = false
      }, 350)
    }
  }

  watch(
    () => props.value,
    (newValue) => {
      showNotice(newValue)
    }
  )

  onMounted(() => {
    // 初始加载一次未读通知数量（可选）
  })
</script>

<style scoped>
  @reference '@styles/core/tailwind.css';

  .art-notification-panel {
    @apply absolute 
    top-14.5 
    right-5 
    w-90 
    h-125 
    overflow-hidden 
    transition-all 
    duration-300
    origin-top 
    will-change-[top,left] 
    max-[640px]:top-[65px]
    max-[640px]:right-0
    max-[640px]:w-full 
    max-[640px]:h-[80vh];
  }

  .bar-active {
    color: var(--theme-color) !important;
    border-bottom: 2px solid var(--theme-color);
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 5px !important;
  }

  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background-color: var(--default-box-color);
  }

  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #222 !important;
  }

  .line-clamp-1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
