import { useUserStore } from '@/store/modules/user'
import request from '@/utils/http'

/** AI 聊天模块 API */

/** SSE 流式事件类型 */
export type ChatStreamEventType =
  | 'stream_start'
  | 'text_start'
  | 'text_delta'
  | 'text_end'
  | 'reasoning_start'
  | 'reasoning_delta'
  | 'reasoning_end'
  | 'tool_call'
  | 'tool_result'
  | 'tool_approval_request'
  | 'citation'
  | 'error'
  | 'stream_end'

/** 待审批项 */
export interface PendingApproval {
  id: string
  tool: string
  arguments: Record<string, unknown>
  reason: string | null
}

/** SSE 事件处理器 */
export interface ChatStreamHandlers {
  /** 文本增量（打字机效果） */
  onTextDelta?: (delta: string) => void
  /** 工具被调用 */
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void
  /** 工具执行结果 */
  onToolResult?: (
    toolName: string,
    result: unknown,
    meta: { successful: boolean; denied: boolean; error: string | null }
  ) => void
  /** 需要人工审批 */
  onApprovalRequest?: (approvals: PendingApproval[]) => void
  /** 流结束 */
  onDone?: (data: { conversationId: string | null; usage?: unknown }) => void
  /** 错误 */
  onError?: (message: string) => void
}

/**
 * 解析后端 SSE 响应（OpenAI 风格：data: {json}\n\n，以 data: [DONE] 结尾）。
 *
 * 注意：conversation_id 不在单独事件里，而是由 stream_end 之后的 then 回调写入；
 * 但默认 SSE 协议不直接返回它，所以前端在新对话首轮后需要从会话列表刷新或后端补充。
 * 这里通过解析 stream_end 之后的事件做兜底。
 */
async function consumeSSE(response: Response, handlers: ChatStreamHandlers): Promise<void> {
  if (!response.ok || !response.body) {
    let msg = `请求失败 (${response.status})`
    try {
      const errBody = await response.json()
      msg = errBody?.message || msg
    } catch {
      // ignore
    }
    handlers.onError?.(msg)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  const processLine = (line: string) => {
    if (!line.startsWith('data:')) return
    const payload = line.slice(5).trim()
    if (!payload || payload === '[DONE]') return

    let event: any
    try {
      event = JSON.parse(payload)
    } catch {
      return
    }

    const type = event?.type as ChatStreamEventType
    switch (type) {
      case 'text_delta':
        if (typeof event.delta === 'string') handlers.onTextDelta?.(event.delta)
        break
      case 'tool_call':
        handlers.onToolCall?.(event.tool_name, event.arguments || {})
        break
      case 'tool_result':
        handlers.onToolResult?.(event.tool_name, event.result, {
          successful: !!event.successful,
          denied: !!event.denied,
          error: event.error ?? null
        })
        break
      case 'tool_approval_request':
        if (Array.isArray(event.approvals)) handlers.onApprovalRequest?.(event.approvals)
        break
      case 'error':
        handlers.onError?.(event.message || 'AI 响应出错')
        break
      case 'stream_end':
        handlers.onDone?.({
          conversationId: event.conversation_id ?? null,
          usage: event.usage
        })
        break
      default:
        break
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        const line = part.trim()
        if (line) processLine(line)
      }
    }
    // 处理缓冲区剩余
    if (buffer.trim()) processLine(buffer.trim())
  } catch (e: any) {
    handlers.onError?.(e?.message || '流读取失败')
  } finally {
    reader.releaseLock()
  }
}

function authHeaders(): Record<string, string> {
  const token = useUserStore().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * 发送消息（SSE 流式）
 */
export async function fetchChatStream(
  data: Api.Chat.SendParams,
  handlers: ChatStreamHandlers
): Promise<void> {
  const { VITE_API_URL } = import.meta.env
  const baseUrl = (VITE_API_URL || '/').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/admin/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders()
    },
    body: JSON.stringify(data)
  })
  await consumeSSE(response, handlers)
}

/**
 * 审批工具调用并继续流式对话
 */
export async function fetchChatApprove(
  data: {
    conversation_id: string
    approval_id: string
    approved: boolean
    reason?: string
  },
  handlers: ChatStreamHandlers
): Promise<void> {
  const { VITE_API_URL } = import.meta.env
  const baseUrl = (VITE_API_URL || '/').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/admin/chat/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders()
    },
    body: JSON.stringify(data)
  })
  await consumeSSE(response, handlers)
}

/** 获取会话列表（分页） */
export function fetchGetConversations(params?: Api.Chat.ConversationListParams) {
  return request.get<Api.Chat.ConversationListResponse>({
    url: '/admin/chat/conversations',
    params
  })
}

/** 获取指定会话的消息记录 */
export function fetchGetConversation(id: string) {
  return request.get<Api.Chat.ConversationDetail>({
    url: `/admin/chat/conversations/${id}`
  })
}

/** 删除会话 */
export function fetchDeleteConversation(id: string) {
  return request.del<void>({
    url: `/admin/chat/conversations/${id}`
  })
}
