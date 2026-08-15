import request from '@/utils/http'

/**
 * 获取通知列表
 */
export function fetchGetNotificationList(params: Api.Notification.ListParams) {
  return request.get<Api.Notification.NotificationListResponse>({
    url: '/admin/notifications',
    params
  })
}

/**
 * 获取未读通知列表
 */
export function fetchGetUnreadNotifications(params: Api.Notification.ListParams) {
  return request.get<Api.Notification.NotificationListResponse>({
    url: '/admin/notifications/unread',
    params
  })
}

/**
 * 标记全部通知为已读
 */
export function fetchMarkAllNotificationsRead() {
  return request.put<{ message: string }>({
    url: '/admin/notifications/mark-all-read',
    showSuccessMessage: true,
    successMessage: '全部标记为已读'
  })
}

/**
 * 标记单条通知为已读
 */
export function fetchMarkNotificationRead(id: string) {
  return request.put<{ message: string }>({
    url: '/admin/notifications/mark-read',
    data: { id }
  })
}

/**
 * 清空已读通知
 */
export function fetchClearReadNotifications() {
  return request.del<void>({
    url: '/admin/notifications/clear-read'
  })
}
