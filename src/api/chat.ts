import request from '@/utils/http'

/** AI 聊天模块 API */

/** 发送消息（同步返回完整回复） */
export function fetchChatSend(data: Api.Chat.SendParams) {
  return request.post<Api.Chat.SendResponse>({
    url: '/admin/chat',
    data
  })
}

/** 发送消息（SSE 流式）- 特殊处理，不在此封装，组件内直接使用 fetch/EventSource */

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
