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
                isStreaming
                  ? 'bg-warning animate-pulse'
                  : isOnline
                    ? 'bg-success/100'
                    : 'bg-danger/100'
              "
            ></div>
            <span class="text-xs text-g-600">{{
              isStreaming ? '思考中...' : isOnline ? '在线' : '离线'
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
            v-if="messages.length === 0 && !isStreaming && !loadError"
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
              v-if="!isMessagePlaceholder(message)"
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
                  'flex max-w-[80%] flex-col',
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

                <!-- 工具调用记录 -->
                <div
                  v-if="message.toolCalls && message.toolCalls.length"
                  class="mb-2 w-full space-y-1"
                >
                  <div
                    v-for="tc in message.toolCalls"
                    :key="tc.id"
                    class="flex-c gap-1.5 rounded bg-g-200/60 px-2.5 py-1 text-xs text-g-700"
                  >
                    <ElIcon><Tools /></ElIcon>
                    <span class="font-medium">{{ toolLabel(tc.name) }}</span>
                  </div>
                </div>

                <!-- 文本气泡 -->
                <div
                  v-if="message.content"
                  :class="[
                    'rounded-md px-3.5 py-2.5 text-sm leading-[1.4] text-g-900 whitespace-pre-wrap break-words',
                    message.role === 'user'
                      ? 'message-right bg-theme/15'
                      : 'message-left bg-g-300/50'
                  ]"
                >
                  {{ message.content }}
                  <span
                    v-if="message.streaming"
                    class="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-g-500 align-middle"
                  ></span>
                </div>

                <!-- 工具结果（成功/失败） -->
                <div
                  v-if="message.toolResults && message.toolResults.length"
                  class="mt-2 w-full space-y-1.5"
                >
                  <div
                    v-for="tr in message.toolResults"
                    :key="tr.id"
                    :class="[
                      'rounded border-l-2 bg-g-100/60 px-2.5 py-1.5 text-xs',
                      tr.denied
                        ? 'border-danger/70'
                        : tr.successful
                          ? 'border-success/70'
                          : 'border-danger/70'
                    ]"
                  >
                    <div class="flex-c gap-1.5">
                      <ElIcon v-if="tr.denied" class="text-danger"><CircleClose /></ElIcon>
                      <ElIcon v-else-if="tr.successful" class="text-success"
                        ><CircleCheck
                      /></ElIcon>
                      <ElIcon v-else class="text-danger"><CircleClose /></ElIcon>
                      <span class="font-medium">{{ toolLabel(tr.name) }}</span>
                      <span class="text-g-500">{{
                        tr.denied ? '已拒绝' : tr.successful ? '执行成功' : '执行失败'
                      }}</span>
                    </div>
                    <div v-if="tr.error" class="mt-0.5 text-danger break-words">{{ tr.error }}</div>
                  </div>
                </div>

                <!-- 待审批卡片 -->
                <div
                  v-if="message.pendingApprovals && message.pendingApprovals.length"
                  class="approval-card mt-2 w-full rounded-md border border-warning/40 bg-warning/5 p-3"
                >
                  <div class="flex-c gap-1.5 text-warning">
                    <ElIcon><WarningFilled /></ElIcon>
                    <span class="text-xs font-medium">需要您的确认</span>
                  </div>
                  <div v-for="approval in message.pendingApprovals" :key="approval.id" class="mt-2">
                    <p class="text-xs text-g-700">
                      <span class="font-medium">{{ toolLabel(approval.tool) }}</span>
                    </p>
                    <p
                      v-if="approval.reason"
                      class="mt-1 whitespace-pre-wrap rounded bg-white/70 p-2 text-xs leading-relaxed text-g-800"
                      >{{ approval.reason }}</p
                    >
                    <details v-if="Object.keys(approval.arguments).length" class="mt-1.5">
                      <summary class="c-p text-[11px] text-g-500 hover:text-theme"
                        >参数详情</summary
                      >
                      <pre
                        class="mt-1 max-h-40 overflow-auto rounded bg-white/80 p-2 text-[11px] text-g-700"
                        >{{ JSON.stringify(approval.arguments, null, 2) }}</pre>
                    </details>
                    <div v-if="!message.approvalResolved" class="mt-2.5 flex gap-2">
                      <ElButton
                        type="primary"
                        size="small"
                        :loading="approvingId === approval.id"
                        @click="resolveApproval(approval.id, true)"
                        >批准执行</ElButton
                      >
                      <ElButton
                        size="small"
                        :loading="approvingId === approval.id"
                        @click="resolveApproval(approval.id, false)"
                        >拒绝</ElButton
                      >
                    </div>
                    <div v-else class="mt-1.5 text-xs">
                      <ElTag
                        :type="message.approvalResolved === 'approved' ? 'success' : 'danger'"
                        size="small"
                        >{{ message.approvalResolved === 'approved' ? '已批准' : '已拒绝' }}</ElTag
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- AI 等待中：仅当存在空的占位 streaming 消息时显示（还没收到任何内容） -->
          <div
            v-if="isStreaming && messages.some((m) => isMessagePlaceholder(m))"
            class="mb-7.5 flex w-full items-start gap-2"
          >
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
            :disabled="isStreaming"
            @keyup.enter.exact.prevent="sendMessage"
          >
            <template #append>
              <div class="flex gap-2 py-2">
                <ElButton type="primary" :loading="isStreaming" @click="sendMessage" v-ripple
                  >发送</ElButton
                >
              </div>
            </template>
          </ElInput>
          <div class="mt-3 flex-cb">
            <span class="text-xs text-g-500">Enter 发送，Shift+Enter 换行</span>
            <ElButton
              type="primary"
              :loading="isStreaming"
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
  import type { PendingApproval } from '@/api/chat'
  import {
    fetchChatApprove,
    fetchChatStream,
    fetchGetConversation,
    fetchGetConversations
  } from '@/api/chat'
  import aiAvatar from '@/assets/images/avatar/ai.png'
  import meAvatar from '@/assets/images/avatar/avatar5.webp'
  import { useUserStore } from '@/store/modules/user'
  import { mittBus } from '@/utils/sys'
  import {
    Check as CircleCheck,
    Close as CircleClose,
    Close,
    Plus,
    Tools,
    WarningFilled
  } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'ArtChatWindow' })

  type ApprovalStatus = 'approved' | 'rejected'

  interface ToolCallRecord {
    id: string
    name: string
    arguments: Record<string, unknown>
  }

  interface ToolResultRecord {
    id: string
    name: string
    result: unknown
    successful: boolean
    denied?: boolean
    error?: string | null
  }

  interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string | null
    streaming?: boolean
    toolCalls?: ToolCallRecord[]
    toolResults?: ToolResultRecord[]
    pendingApprovals?: PendingApproval[]
    approvalResolved?: ApprovalStatus
  }

  // 常量定义
  const MOBILE_BREAKPOINT = 640
  const SCROLL_DELAY = 80
  const BOT_NAME = 'Art Bot'
  const quickQuestions = ['介绍一下系统功能', '怎么创建管理员？', '如何配置邮件？']

  // 工具名中文映射
  const TOOL_LABELS: Record<string, string> = {
    list_users: '查询用户列表',
    get_user: '查询用户详情',
    set_user_status: '修改用户状态',
    adjust_user_balance: '调整用户余额',
    reset_user_password: '重置用户密码',
    get_setting: '查询系统配置',
    set_setting: '修改系统配置',
    get_dashboard_stats: '查询数据概览'
  }
  const toolLabel = (name: string): string => TOOL_LABELS[name] || name

  // 用户信息
  const userStore = useUserStore()
  const userName = computed(() => userStore.adminInfo?.user_name || '我')

  // 响应式布局
  const { width } = useWindowSize()
  const isMobile = computed(() => width.value < MOBILE_BREAKPOINT)

  // 组件状态
  const isDrawerVisible = ref(false)
  const isOnline = ref(true)
  const isStreaming = ref(false)
  const loadError = ref<string>('')
  const approvingId = ref<string | null>(null)

  // 消息相关状态
  const messageText = ref('')
  const messageContainer = ref<HTMLElement | null>(null)
  const currentConversationId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])

  /**
   * 判断是否是「占位」的空 streaming assistant 消息。
   * 此时还没有任何文本/工具调用/审批内容，整行（含头像）不渲染，
   * 由底部独立的思考中气泡展示等待状态，避免出现两个 AI 头像。
   */
  const isMessagePlaceholder = (m: ChatMessage): boolean => {
    if (!m.streaming || m.role !== 'assistant') return false
    return (
      !m.content &&
      (!m.toolCalls || m.toolCalls.length === 0) &&
      (!m.toolResults || m.toolResults.length === 0) &&
      (!m.pendingApprovals || m.pendingApprovals.length === 0)
    )
  }

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
          created_at: m.created_at,
          toolCalls: (m.tool_calls || []).map((tc) => ({
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments
          })),
          toolResults: (m.tool_results || []).map((tr) => ({
            id: tr.id,
            name: tr.name,
            result: tr.result,
            successful: !!tr.successful,
            denied: !!tr.denied,
            error: tr.error ?? null
          }))
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

  /**
   * 发起一次流式对话（首次提问或审批续跑共用）。
   */
  const runStream = async (
    requester: () => Promise<void>,
    options: { pendingAssistantId: string }
  ): Promise<void> => {
    isStreaming.value = true
    try {
      await requester()
    } catch (e: any) {
      ElMessage.error(e?.message || '请求失败，请重试')
      // 失败时将正在流式的 assistant 消息标记为非 streaming
      const m = messages.value.find((x) => x.id === options.pendingAssistantId)
      if (m) m.streaming = false
    } finally {
      isStreaming.value = false
      scrollToBottom()
    }
  }

  /**
   * 通用 SSE 事件处理：基于当前 assistant 消息增量更新。
   */
  const bindStreamHandlers = (assistantId: string) => ({
    onTextDelta: (delta: string) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.content += delta
      scrollToBottom()
    },
    onToolCall: (toolName: string, args: Record<string, unknown>) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (!m) return
      const id = (args?.id as string) || `${toolName}-${Date.now()}`
      m.toolCalls = [...(m.toolCalls || []), { id, name: toolName, arguments: args }]
      scrollToBottom()
    },
    onToolResult: (
      toolName: string,
      result: unknown,
      meta: { successful: boolean; denied: boolean; error: string | null }
    ) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (!m) return
      m.toolResults = [
        ...(m.toolResults || []),
        {
          id: `${toolName}-result-${Date.now()}`,
          name: toolName,
          result,
          successful: meta.successful,
          denied: meta.denied,
          error: meta.error
        }
      ]
      scrollToBottom()
    },
    onApprovalRequest: (approvals: PendingApproval[]) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.pendingApprovals = approvals
      scrollToBottom()
    },
    onDone: () => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.streaming = false
      // 流结束后刷新会话 ID（首轮对话可能尚未拿到）
      if (!currentConversationId.value) {
        refreshConversationId()
      }
      scrollToBottom()
    },
    onError: (msg: string) => {
      ElMessage.error(msg)
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.streaming = false
    }
  })

  /**
   * 流结束后从服务端获取最新 conversation_id（首轮对话）。
   */
  const refreshConversationId = async (): Promise<void> => {
    try {
      const res = await fetchGetConversations({ page: 1, per_page: 1 })
      if (res.data && res.data.length > 0) {
        currentConversationId.value = res.data[0].id
      }
    } catch {
      // 忽略
    }
  }

  // 发送消息
  const sendMessage = async (): Promise<void> => {
    const text = messageText.value.trim()
    if (!text || isStreaming.value) return

    const userMsg: ChatMessage = {
      id: genLocalId(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    }
    messages.value.push(userMsg)

    // 预创建空的 assistant 消息，用于承载流式内容
    const assistantId = genLocalId()
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
      toolCalls: [],
      toolResults: []
    })

    messageText.value = ''
    scrollToBottom()

    const handlers = bindStreamHandlers(assistantId)

    await runStream(
      () =>
        fetchChatStream(
          {
            prompt: text,
            conversation_id: currentConversationId.value
          },
          handlers
        ),
      { pendingAssistantId: assistantId }
    )
  }

  // 处理审批
  const resolveApproval = async (approvalId: string, approved: boolean): Promise<void> => {
    if (!currentConversationId.value) {
      ElMessage.error('会话 ID 缺失，无法处理审批')
      return
    }
    approvingId.value = approvalId

    // 找到包含该审批的消息
    const target = messages.value.find((m) => m.pendingApprovals?.some((a) => a.id === approvalId))
    if (target) target.approvalResolved = approved ? 'approved' : 'rejected'

    // 续跑：新增一条空 assistant 消息承载后续流式内容
    const assistantId = genLocalId()
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
      toolCalls: [],
      toolResults: []
    })
    scrollToBottom()

    const handlers = bindStreamHandlers(assistantId)
    isStreaming.value = true

    try {
      await fetchChatApprove(
        {
          conversation_id: currentConversationId.value,
          approval_id: approvalId,
          approved
        },
        handlers
      )
    } catch (e: any) {
      ElMessage.error(e?.message || '审批请求失败')
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.streaming = false
      if (target) target.approvalResolved = undefined
    } finally {
      isStreaming.value = false
      approvingId.value = null
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

  .approval-card details > summary {
    list-style: none;
  }

  .approval-card details > summary::-webkit-details-marker {
    display: none;
  }
</style>
