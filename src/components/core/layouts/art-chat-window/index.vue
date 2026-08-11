<!-- 系统聊天窗口 -->
<template>
  <div>
    <ElDrawer v-model="isDrawerVisible" :size="isMobile ? '100%' : '480px'" :with-header="false">
      <div class="mb-5 flex-cb">
        <div>
          <span class="text-base font-medium">Ai Bot</span>
          <div class="mt-1.5 flex-c gap-1">
            <div
              class="h-2 w-2 rounded-full"
              :class="
                isThinking
                  ? 'bg-warning animate-pulse'
                  : isOnline
                    ? 'bg-success/100'
                    : 'bg-danger/100'
              "
            ></div>
            <span class="text-xs text-g-600">{{
              isThinking ? '思考中...' : isOnline ? '在线' : '离线'
            }}</span>
          </div>
        </div>
        <div class="flex-c gap-2">
          <ElTooltip content="新对话" placement="bottom">
            <ElIcon class="c-p text-g-600 hover:text-theme" :size="18" @click="startNewChat">
              <Plus />
            </ElIcon>
          </ElTooltip>
          <ElIcon class="c-p" :size="20" @click="closeChat">
            <Close />
          </ElIcon>
        </div>
      </div>
      <div class="flex h-[calc(100%-70px)] flex-col">
        <!-- 聊天消息区域 -->
        <div
          class="chat-scroll flex-1 overflow-y-auto border-t-d px-4 py-7.5"
          ref="messageContainer"
        >
          <!-- 空状态 / 快捷问题 -->
          <div
            v-if="messages.length === 0 && !isThinking && !loadError"
            class="flex h-full flex-col items-center justify-center text-center"
          >
            <img :src="aiAvatar" class="h-14 w-14 rounded-full" />
            <p class="mt-3 text-sm font-medium">你好！我是你的AI助手，有什么我可以帮你的吗？</p>
            <div class="mt-5 flex flex-wrap justify-center gap-2">
              <ElButton v-for="q in quickQuestions" :key="q" size="small" @click="fillAndSend(q)">{{
                q
              }}</ElButton>
            </div>
          </div>

          <!-- 错误状态 -->
          <div
            v-if="loadError"
            class="flex h-full flex-col items-center justify-center text-center"
          >
            <p class="text-sm text-danger">{{ loadError }}</p>
            <ElButton size="small" class="mt-3" @click="loadLatestConversation">重试</ElButton>
          </div>

          <template v-for="message in messages" :key="message.id">
            <div
              :class="[
                'mb-7.5 flex w-full items-start gap-2',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              ]"
            >
              <ElAvatar
                :size="32"
                :src="message.role === 'user' ? meAvatar : aiAvatar"
                class="shrink-0"
              />
              <div
                :class="[
                  'flex max-w-[70%] flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                ]"
              >
                <div
                  :class="[
                    'mb-1 flex gap-2 text-xs',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  ]"
                >
                  <span class="font-medium">{{
                    message.role === 'user' ? userName : BOT_NAME
                  }}</span>
                  <span class="text-g-600">{{ formatTime(message.created_at) }}</span>
                </div>
                <div
                  :class="[
                    'rounded-md px-3.5 py-2.5 text-sm leading-[1.4] text-g-900 whitespace-pre-wrap break-words',
                    message.role === 'user'
                      ? 'message-right bg-theme/15'
                      : 'message-left bg-g-300/50'
                  ]"
                  >{{ message.content }}</div
                >
              </div>
            </div>
          </template>

          <!-- AI 回复中 -->
          <div v-if="isThinking" class="mb-7.5 flex w-full items-start gap-2">
            <ElAvatar :size="32" :src="aiAvatar" class="shrink-0" />
            <div class="flex max-w-[70%] flex-col items-start">
              <div class="mb-1 flex gap-2 text-xs">
                <span class="font-medium">{{ BOT_NAME }}</span>
              </div>
              <div class="flex items-center gap-1 rounded-md bg-g-300/50 px-3.5 py-3">
                <span
                  class="h-1.5 w-1.5 animate-bounce rounded-full bg-g-500"
                  style="animation-delay: 0ms"
                ></span>
                <span
                  class="h-1.5 w-1.5 animate-bounce rounded-full bg-g-500"
                  style="animation-delay: 150ms"
                ></span>
                <span
                  class="h-1.5 w-1.5 animate-bounce rounded-full bg-g-500"
                  style="animation-delay: 300ms"
                ></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 聊天输入区域 -->
        <div class="px-4 pt-4">
          <ElInput
            v-model="messageText"
            type="textarea"
            :rows="3"
            :placeholder="$t('chat.placeholder')"
            resize="none"
            :disabled="isThinking"
            @keyup.enter.exact.prevent="sendMessage"
          >
            <template #append>
              <div class="flex gap-2 py-2">
                <ElButton type="primary" :loading="isThinking" @click="sendMessage" v-ripple
                  >发送</ElButton
                >
              </div>
            </template>
          </ElInput>
          <div class="mt-3 flex-cb">
            <span class="text-xs text-g-500">Enter 发送，Shift+Enter 换行</span>
            <ElButton
              type="primary"
              :loading="isThinking"
              :disabled="!messageText.trim()"
              @click="sendMessage"
              v-ripple
              class="min-w-20"
              >发送</ElButton
            >
          </div>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { fetchChatSend, fetchGetConversation, fetchGetConversations } from '@/api/chat'
  import aiAvatar from '@/assets/images/avatar/ai.png'
  import meAvatar from '@/assets/images/avatar/avatar5.webp'
  import { useUserStore } from '@/store/modules/user'
  import { mittBus } from '@/utils/sys'
  import { Close, Plus } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'ArtChatWindow' })

  // 类型定义
  interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string | null
  }

  // 常量定义
  const MOBILE_BREAKPOINT = 640
  const SCROLL_DELAY = 100
  const BOT_NAME = 'Art Bot'
  const quickQuestions = ['介绍一下系统功能', '怎么创建管理员？', '如何配置邮件？']

  // 用户信息
  const userStore = useUserStore()
  const userName = computed(() => userStore.adminInfo?.user_name || '我')

  // 响应式布局
  const { width } = useWindowSize()
  const isMobile = computed(() => width.value < MOBILE_BREAKPOINT)

  // 组件状态
  const isDrawerVisible = ref(false)
  const isOnline = ref(true)
  const isThinking = ref(false)
  const loadError = ref<string>('')

  // 消息相关状态
  const messageText = ref('')
  const messageContainer = ref<HTMLElement | null>(null)
  const currentConversationId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])

  // 本地 id 生成器
  let localMsgSeq = 1
  const genLocalId = () => `local-${Date.now()}-${localMsgSeq++}`

  // 工具函数
  const formatCurrentTime = (): string => {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (t: string | null): string => {
    if (!t) return formatCurrentTime()
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return formatCurrentTime()
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleString([], {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
  }

  const scrollToBottom = (): void => {
    nextTick(() => {
      setTimeout(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      }, SCROLL_DELAY)
    })
  }

  // 加载最近会话
  const loadLatestConversation = async (): Promise<void> => {
    loadError.value = ''
    try {
      const res = await fetchGetConversations({ page: 1, per_page: 1 })
      if (res.data && res.data.length > 0) {
        const convId = res.data[0].id
        const detail = await fetchGetConversation(convId)
        currentConversationId.value = detail.id
        messages.value = detail.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at
        }))
      } else {
        currentConversationId.value = null
        messages.value = []
      }
      scrollToBottom()
    } catch (e: any) {
      loadError.value = e?.message || '会话加载失败'
    }
  }

  // 新对话
  const startNewChat = (): void => {
    currentConversationId.value = null
    messages.value = []
    loadError.value = ''
    messageText.value = ''
    ElMessage.success('已开启新对话')
  }

  // 消息处理方法
  const sendMessage = async (): Promise<void> => {
    const text = messageText.value.trim()
    if (!text || isThinking.value) return

    const newMessage: ChatMessage = {
      id: genLocalId(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    }

    messages.value.push(newMessage)
    messageText.value = ''
    isThinking.value = true
    scrollToBottom()

    try {
      const res = await fetchChatSend({
        prompt: text,
        conversation_id: currentConversationId.value
      })
      currentConversationId.value = res.conversation_id
      messages.value.push({
        id: genLocalId(),
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString()
      })
    } catch (e: any) {
      ElMessage.error(e?.message || '发送失败，请重试')
    } finally {
      isThinking.value = false
      scrollToBottom()
    }
  }

  const fillAndSend = (q: string): void => {
    messageText.value = q
    sendMessage()
  }

  // 聊天窗口控制方法
  const openChat = (): void => {
    isDrawerVisible.value = true
    if (messages.value.length === 0 && !loadError.value) {
      loadLatestConversation()
    } else {
      scrollToBottom()
    }
  }

  const closeChat = (): void => {
    isDrawerVisible.value = false
  }

  // 生命周期
  onMounted(() => {
    scrollToBottom()
    mittBus.on('openChat', openChat)
  })

  onUnmounted(() => {
    mittBus.off('openChat', openChat)
  })
</script>

<style scoped>
  .chat-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .chat-scroll::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
</style>
